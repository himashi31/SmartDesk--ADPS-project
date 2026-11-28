# Deployment (Day 11)

The app has three parts that are deployed separately:

| Part | Suggested host | Notes |
|---|---|---|
| MySQL | Azure Database for MySQL / AWS RDS / Aiven / Railway | any MySQL 8 |
| Backend | Render (Web Service, Docker or Java) / Azure App Service / AWS Elastic Beanstalk | needs Java 17 |
| Frontend | Vercel (easiest for Next.js) / Render / Azure Static Web Apps | |

## 1. Database — Oshani
1. Create a MySQL 8 instance and a database `smartdesk`.
2. Run `database/schema.sql` (remove the `DROP TABLE` lines if the database already contains data).
3. Create a dedicated user instead of root:
   ```sql
   CREATE USER 'smartdesk_app'@'%' IDENTIFIED BY '<strong password>';
   GRANT SELECT, INSERT, UPDATE, DELETE ON smartdesk.* TO 'smartdesk_app'@'%';
   ```
4. Export a backup before the demo: `mysqldump ... smartdesk > smartdesk_backup.sql`.

## 2. Backend — Yusuf & Chamodya
Build: `cd backend && mvn clean package -DskipTests` → `target/smartdesk-backend-1.0.0.jar`
Run:   `java -jar target/smartdesk-backend-1.0.0.jar`

Environment variables (production):

| Variable | Example |
|---|---|
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `DB_URL` | `jdbc:mysql://<host>:3306/smartdesk?useSSL=true&serverTimezone=UTC` |
| `DB_USERNAME` / `DB_PASSWORD` | `smartdesk_app` / … |
| `JWT_SECRET` | a random string of **at least 32 characters** (`openssl rand -base64 48`) |
| `CORS_ORIGINS` | `https://smartdesk.vercel.app` (your frontend URL, comma-separate several) |
| `SEED_DEMO_DATA` | `true` only for the demo deployment, otherwise `false` |
| `PORT` | set automatically by Render/Azure |

Render: *New → Web Service*, root directory `backend`, build command `mvn clean package -DskipTests`,
start command `java -jar target/smartdesk-backend-1.0.0.jar`, runtime Java (or use the Dockerfile below).

Optional `backend/Dockerfile`:
```dockerfile
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -q clean package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/smartdesk-backend-1.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

Check: `https://<backend-url>/api/health` → `{"status":"UP"}`

## 3. Frontend — Dunya & Nirasha
Vercel: import the GitHub repo, root directory `frontend`, add environment variable
`NEXT_PUBLIC_API_URL=https://<backend-url>` and deploy.
Manual: `npm ci && npm run build && npm start` (port 3000).

After deploying, add the frontend URL to the backend's `CORS_ORIGINS` and restart the backend.

## 4. Security checklist — Chamodya
- [ ] `JWT_SECRET` changed from the default
- [ ] Database password not committed to Git (`.env.local`, `application-*.properties` contain only `${VARIABLES}`)
- [ ] HTTPS on both frontend and backend URLs
- [ ] `CORS_ORIGINS` lists only the real frontend URL
- [ ] Demo seeding disabled for any real use
- [ ] Default demo passwords changed if the deployment stays online

## 5. Final checks — Nirasha
- [ ] All pages load on desktop, tablet and phone widths
- [ ] Login works with each demo account on the deployed version
- [ ] Full workflow from TEST-PLAN Day 7 works on the deployed version
