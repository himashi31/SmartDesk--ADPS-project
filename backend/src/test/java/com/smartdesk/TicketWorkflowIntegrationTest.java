package com.smartdesk;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Day 6 / Day 7 / Day 9 end-to-end tests against an in-memory H2 database seeded with demo data.
 * Run with:  mvn test
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("h2")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class TicketWorkflowIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;

    private String login(String email) throws Exception {
        MvcResult r = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"Password123!\"}"))
                .andExpect(status().isOk()).andReturn();
        return "Bearer " + json.readTree(r.getResponse().getContentAsString()).get("token").asText();
    }

    private JsonNode body(MvcResult r) throws Exception {
        return json.readTree(r.getResponse().getContentAsString());
    }

    @Test
    void fullTicketLifecycle() throws Exception {
        String user = login("user1@smartdesk.local");
        String admin = login("admin@smartdesk.local");
        String tech = login("tech1@smartdesk.local");

        // 1. user creates a ticket
        JsonNode created = body(mvc.perform(post("/api/tickets").header("Authorization", user)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Monitor flickers\",\"description\":\"The monitor flickers every few seconds.\",\"priority\":\"HIGH\",\"categoryId\":1}"))
                .andExpect(status().isCreated()).andReturn());
        long id = created.get("id").asLong();
        assertThat(created.get("status").asText()).isEqualTo("OPEN");

        // 2. technician sees it in the unassigned queue
        JsonNode queue = body(mvc.perform(get("/api/tickets?scope=unassigned").header("Authorization", tech))
                .andExpect(status().isOk()).andReturn());
        assertThat(queue.findValues("id").stream().map(JsonNode::asLong)).contains(id);

        // 3. administrator assigns it to technician 1
        long techId = body(mvc.perform(get("/api/auth/me").header("Authorization", tech)).andReturn()).get("id").asLong();
        mvc.perform(put("/api/tickets/" + id + "/assign").header("Authorization", admin)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"technicianId\":" + techId + "}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.assignedTo.id").value(techId));

        // 4. technician changes status; resolving without a resolution is rejected
        mvc.perform(put("/api/tickets/" + id + "/status").header("Authorization", tech)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"IN_PROGRESS\"}"))
                .andExpect(status().isOk());
        mvc.perform(put("/api/tickets/" + id + "/status").header("Authorization", tech)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"RESOLVED\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(put("/api/tickets/" + id + "/status").header("Authorization", tech)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"RESOLVED\",\"resolution\":\"Replaced the cable.\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resolvedAt").exists());

        // 5. user sees the updated status and closes the ticket
        mvc.perform(get("/api/tickets/" + id).header("Authorization", user))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESOLVED"))
                .andExpect(jsonPath("$.resolution").value("Replaced the cable."));
        mvc.perform(put("/api/tickets/" + id + "/status").header("Authorization", user)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"CLOSED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLOSED"));

        // history recorded every step
        JsonNode history = body(mvc.perform(get("/api/tickets/" + id + "/history").header("Authorization", user)).andReturn());
        assertThat(history.size()).isGreaterThanOrEqualTo(5);
    }

    @Test
    void usersCannotSeeOtherUsersTickets() throws Exception {
        String user1 = login("user1@smartdesk.local");
        String user2 = login("user2@smartdesk.local");

        long id = body(mvc.perform(post("/api/tickets").header("Authorization", user1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Private problem\",\"description\":\"Only I should see this ticket.\"}"))
                .andReturn()).get("id").asLong();

        mvc.perform(get("/api/tickets/" + id).header("Authorization", user2)).andExpect(status().isNotFound());
        mvc.perform(get("/api/tickets/" + id + "/comments").header("Authorization", user2)).andExpect(status().isNotFound());

        // even when asking for scope=all a user only receives their own tickets
        JsonNode list = body(mvc.perform(get("/api/tickets?scope=all").header("Authorization", user2)).andReturn());
        list.forEach(t -> assertThat(t.get("createdBy").get("email").asText()).isEqualTo("user2@smartdesk.local"));
    }

    @Test
    void roleRestrictions() throws Exception {
        String user = login("user1@smartdesk.local");
        String tech = login("tech1@smartdesk.local");

        mvc.perform(get("/api/tickets")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/users").header("Authorization", user)).andExpect(status().isForbidden());
        mvc.perform(get("/api/users").header("Authorization", tech)).andExpect(status().isForbidden());
        mvc.perform(get("/api/stats").header("Authorization", tech)).andExpect(status().isForbidden());
        mvc.perform(post("/api/categories").header("Authorization", tech)
                .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"X\"}")).andExpect(status().isForbidden());
        mvc.perform(get("/api/users/technicians").header("Authorization", tech)).andExpect(status().isOk());
        // users cannot change the status of an open ticket themselves
        mvc.perform(put("/api/tickets/1/status").header("Authorization", user)
                .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"RESOLVED\",\"resolution\":\"x\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void internalNotesAreHiddenFromUsers() throws Exception {
        // seeded ticket #2 has one internal note out of three comments
        String user = login("user1@smartdesk.local");
        String tech = login("tech1@smartdesk.local");
        JsonNode forUser = body(mvc.perform(get("/api/tickets/2/comments").header("Authorization", user)).andReturn());
        JsonNode forTech = body(mvc.perform(get("/api/tickets/2/comments").header("Authorization", tech)).andReturn());
        assertThat(forUser.size()).isEqualTo(2);
        assertThat(forTech.size()).isEqualTo(3);
    }

    @Test
    void registrationAndValidation() throws Exception {
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"New Person\",\"email\":\"new@example.com\",\"password\":\"Secret123\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.role").value("USER"))
                .andExpect(jsonPath("$.token").exists());
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Dup\",\"email\":\"new@example.com\",\"password\":\"Secret123\"}"))
                .andExpect(status().isConflict());
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"\",\"email\":\"bad\",\"password\":\"1\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.email").exists());
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@smartdesk.local\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized());
    }
}
