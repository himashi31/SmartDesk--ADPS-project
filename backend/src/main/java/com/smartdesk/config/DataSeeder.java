package com.smartdesk.config;

import com.smartdesk.model.*;
import com.smartdesk.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Inserts demo accounts, categories and sample tickets the first time the application
 * starts with an empty database. Password for every demo account: Password123!
 * Disable with SEED_DEMO_DATA=false.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);
    public static final String DEMO_PASSWORD = "Password123!";

    private final UserRepository users;
    private final CategoryRepository categories;
    private final TicketRepository tickets;
    private final CommentRepository comments;
    private final TicketHistoryRepository history;
    private final PasswordEncoder encoder;
    private final boolean enabled;

    public DataSeeder(UserRepository users, CategoryRepository categories, TicketRepository tickets,
                      CommentRepository comments, TicketHistoryRepository history, PasswordEncoder encoder,
                      @Value("${app.seed-demo-data:true}") boolean enabled) {
        this.users = users;
        this.categories = categories;
        this.tickets = tickets;
        this.comments = comments;
        this.history = history;
        this.encoder = encoder;
        this.enabled = enabled;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (!enabled || users.count() > 0) return;
        log.info("Empty database detected – inserting SmartDesk demo data");

        String hash = encoder.encode(DEMO_PASSWORD);
        User admin = users.save(new User("System Administrator", "admin@smartdesk.local", hash, Role.ADMIN, "IT Department"));
        User tech1 = users.save(new User("Tom Technician", "tech1@smartdesk.local", hash, Role.TECHNICIAN, "IT Support"));
        User tech2 = users.save(new User("Tina Technician", "tech2@smartdesk.local", hash, Role.TECHNICIAN, "IT Support"));
        User user1 = users.save(new User("Uma Student", "user1@smartdesk.local", hash, Role.USER, "Computer Science"));
        User user2 = users.save(new User("Ulf Employee", "user2@smartdesk.local", hash, Role.USER, "Finance"));

        Category hardware = categories.save(new Category("Hardware", "Computers, printers, monitors and other devices"));
        Category software = categories.save(new Category("Software", "Installation, licences and application errors"));
        Category network = categories.save(new Category("Network", "Wi-Fi, VPN, internet and LAN problems"));
        Category account = categories.save(new Category("Account Access", "Passwords, logins and permissions"));
        categories.save(new Category("Email", "Mailbox, Outlook and calendar issues"));
        categories.save(new Category("Other", "Anything that does not fit another category"));

        Ticket t1 = ticket("Laptop does not turn on", "My laptop shows no power light even when plugged in.",
                TicketStatus.OPEN, TicketPriority.HIGH, hardware, user1, null, null);
        Ticket t2 = ticket("Cannot connect to campus Wi-Fi", "Wi-Fi keeps asking for my password and then disconnects.",
                TicketStatus.IN_PROGRESS, TicketPriority.MEDIUM, network, user1, tech1, null);
        Ticket t3 = ticket("Need Microsoft Office installed", "Please install Office on the finance office PC #12.",
                TicketStatus.OPEN, TicketPriority.LOW, software, user2, null, null);
        Ticket t4 = ticket("Forgot my portal password", "I am locked out of the student portal after 3 attempts.",
                TicketStatus.RESOLVED, TicketPriority.URGENT, account, user2, tech2,
                "Account unlocked and temporary password issued.");
        Ticket t5 = ticket("Printer on 2nd floor jams", "The shared printer jams on every second page.",
                TicketStatus.ON_HOLD, TicketPriority.MEDIUM, hardware, user2, tech1, null);

        comments.save(new Comment(t2, tech1, "Hi Uma, could you tell me which building you are in?", false));
        comments.save(new Comment(t2, user1, "I am in Building B, room 204.", false));
        comments.save(new Comment(t2, tech1, "Probably the old certificate on the access point.", true));
        comments.save(new Comment(t4, tech2, "Your account is unlocked. Please change the password on first login.", false));

        for (Ticket t : new Ticket[]{t1, t2, t3, t4, t5}) {
            history.save(new TicketHistory(t, t.getCreatedBy(), "CREATED", "Ticket created"));
        }
        history.save(new TicketHistory(t2, admin, "ASSIGNED", "Assigned to " + tech1.getFullName()));
        history.save(new TicketHistory(t2, tech1, "STATUS_CHANGED", "OPEN -> IN_PROGRESS"));
        history.save(new TicketHistory(t4, admin, "ASSIGNED", "Assigned to " + tech2.getFullName()));
        history.save(new TicketHistory(t4, tech2, "STATUS_CHANGED", "OPEN -> RESOLVED"));
        history.save(new TicketHistory(t5, admin, "ASSIGNED", "Assigned to " + tech1.getFullName()));
        history.save(new TicketHistory(t5, tech1, "STATUS_CHANGED", "OPEN -> ON_HOLD"));

        log.info("Demo accounts: admin@ / tech1@ / tech2@ / user1@ / user2@smartdesk.local  (password: {})", DEMO_PASSWORD);
    }

    private Ticket ticket(String title, String desc, TicketStatus status, TicketPriority priority, Category category,
                          User creator, User assignee, String resolution) {
        Ticket t = new Ticket();
        t.setTitle(title);
        t.setDescription(desc);
        t.setStatus(status);
        t.setPriority(priority);
        t.setCategory(category);
        t.setCreatedBy(creator);
        t.setAssignedTo(assignee);
        t.setResolution(resolution);
        if (status.isFinished()) t.setResolvedAt(LocalDateTime.now());
        return tickets.save(t);
    }
}
