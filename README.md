# MEDXI — Virtual Health Companion

MEDXI is a role-based digital health platform that helps patients track vital signs, lets providers monitor their caseload, and gives administrators the tools to manage the system. It pairs a React dashboard with an Express and MongoDB backend, uses Socket.IO for realtime messaging and presence, integrates Google Gemini for conversational health guidance, and ingests metrics from Google Fit.

## Features

### Recent Updates

- **Enhanced provider workspace** — multi-tab dashboard covering overview, calendar, patient list, alerts, and messaging
- **Gamification** — wellness score, streaks, challenges, achievements, and a leaderboard
- **Expanded Google Fit sync** — broader metric ingestion with improved mapping and schema alignment
- **Improved metric quality** — tighter thresholds and finer granularity for more accurate tracking
- **Theme and auth UX** — Google OAuth login and signup, a password-setup flow for OAuth accounts, and persisted UI preferences
- **Realtime layer** — Socket.IO powered direct messaging with typing indicators and online presence
- **Data export** — CSV and PDF exports of patient health history
- **Medication management** — medication scheduling, daily adherence logging, and adherence statistics
- **Feedback capture** — in-app feedback submission with an admin review surface
- **Recipes** — browsable recipe catalog with categories

### For Patients

- **Health metrics tracking** for heart rate, blood pressure, blood glucose, oxygen saturation, sleep, and steps
- **AI health assistant** powered by Google Gemini 2.0
- **AI-generated insights** derived from recent metrics
- **Wearable device integration** with simulated data from Apple Watch, Fitbit, and Samsung Health, plus Google Fit sync
- **Interactive dashboard** with trend charts and daily aggregated totals
- **Medication tracker** with scheduling, daily status, and adherence statistics
- **Recipe catalog** organized by category for dietary guidance
- **Data export** of personal health history to CSV or PDF
- **Gamification** with wellness score, streaks, challenges, and achievements

### For Healthcare Providers

- **Patient management** through provider patient lists and detailed metric snapshots
- **Real-time monitoring** of patient vital signs with quick-acknowledge alerts
- **Tabbed dashboard** covering overview, calendar, patients, alerts, and messages
- **Appointment operations** for managing bookings and reviewing provider availability
- **Patient gamification view** so providers can review a specific patient's engagement stats

### For Administrators

- **User management** across patients, providers, and system accounts
- **System statistics** and aggregated platform metrics
- **Audit log review** of key user and system events
- **Feedback review** for submissions collected from users
- **Role-based access control** across patient, provider, and admin roles

## Tech Stack

### Frontend

- **React 19** with **Vite** for the build tool and dev server
- **TanStack Query** for data fetching and caching
- **React Router** for client-side routing
- **Recharts** for health data visualization
- **Tailwind CSS 4** for styling
- **Radix UI** and **Ark UI** for accessible primitives
- **Framer Motion** for animation
- **Socket.IO client** for realtime messaging and presence
- **React Hook Form** with **Yup** for form handling and validation

### Backend

- **Node.js** with **Express 5** for the REST API
- **MongoDB** with **Mongoose** for data storage
- **Socket.IO** for realtime messaging, typing indicators, and presence
- **JWT** with access and refresh tokens for authentication
- **bcryptjs** for password hashing
- **Helmet**, **express-rate-limit**, and **express-mongo-sanitize** for hardening
- **Multer** for upload handling
- **PDFKit** for PDF export
- **googleapis** for Google Fit and Google OAuth integration
- **Google Gemini 2.0 API** for the AI assistant and insights

## Installation and Running the Application

MEDXI ships with a startup script that handles everything for you. It verifies that Node.js and npm are installed, installs backend and frontend dependencies on first run, generates the required `.env` files with sensible defaults (including random JWT secrets), prompts only for values it cannot default (such as `MONGODB_URI` and `GEMINI_API_KEY`), and then launches the backend and frontend in two separate PowerShell windows.

### 1. Clone the repository

```bash
git clone https://github.com/MrNoobri/F29SO-.git
cd F29SO-
```

### 2. Start the app

From PowerShell:

```powershell
./start-medxi.ps1
```

Or from a regular command prompt:

```bat
start-medxi.bat
```

Once the script finishes, the backend is available at `http://localhost:5000` and the frontend at `http://localhost:5173`. A liveness probe is exposed at `GET /health`. To stop everything, run `stop-medxi.ps1` or `stop-medxi.bat` from the project root.

### 3. Seed demo data (optional)

```bash
cd server
npm run seed-demo
```

This creates three demo accounts, each preloaded with 30 days of health data:

- **Patient:** `patient@demo.com` / `demo1234`
- **Provider:** `provider@demo.com` / `demo1234`
- **Admin:** `admin@demo.com` / `demo1234`

### Google Cloud setup

Google OAuth login and Google Fit sync both require credentials configured in Google Cloud. The startup script will pick these up from `server/.env` if present. Use the following URIs during local development:

- Authorized JavaScript origins:
  - `http://localhost:5173`
  - `http://localhost:5174`
  - `http://localhost:5000`
- Authorized redirect URIs:
  - `http://localhost:5000/api/auth/google/callback`
  - `http://localhost:5000/api/googlefit/callback`

If the OAuth consent screen is still in **Testing**, add each tester email under **Test users** in Google Cloud.

## Key Features Walkthrough

### 1. Health metrics dashboard

View real-time metrics with status indicators, click any metric card to see a trend chart, and add new readings manually or through a connected device.

### 2. Wearable device simulator and Google Fit

Open the **Wearable Devices** tab in the patient dashboard to start the simulator, which generates realistic readings every 30 seconds and persists across tab switches. Alternatively, connect a Google account through the Google Fit integration to pull in real data on demand.

### 3. AI health assistant

Open the chatbot to ask questions such as "What is a healthy diet?", "How can I improve my sleep?", or "Tips for managing stress?". Responses are generated by Gemini 2.0 and tailored to general wellness guidance.

### 4. Health insights

Review AI-generated summaries of your recent metrics, see recommendations for improvement, and spot patterns in your data over time.

### 5. Medication tracker

Add medications with dosage and schedule, see today's adherence status, log doses as you take them, and review adherence statistics over time.

### 6. Provider dashboard

Switch between dedicated tabs for **Overview**, **Calendar**, **Patients**, **Alerts**, and **Messages**. Open detailed appointment and patient panels directly from the provider workflow and review patient lists through provider-specific endpoints.

### 7. Gamification

Track wellness score, streaks, challenges, and achievements, claim rewards for completed challenges, and compare activity with other users on the leaderboard.

### 8. Data export

Export patient health history as CSV or PDF, optionally filtered by date range.

## Security Features

- **Password hashing** with bcryptjs
- **JWT authentication** with access and refresh tokens stored in HTTP-only cookies
- **Role-based access control** across patient, provider, and admin roles
- **Helmet** security headers
- **Per-route rate limiting** for login, registration, and the general API surface
- **NoSQL injection sanitization** on request bodies
- **CORS protection** configured for approved origins
- **File upload validation** for message attachments
- **Audit logging** of user actions and system events

## API Endpoints

The REST API is served under `/api`. All routes require a valid access token unless marked as public. Realtime messaging and presence are handled by Socket.IO on the same origin as the backend.

### Authentication (`/api/auth`)

- `POST /register` — register a new user
- `POST /login` — log in with email and password
- `GET /google` — start the Google OAuth flow
- `GET /google/callback` — Google OAuth callback
- `POST /refresh` — refresh the access token
- `POST /logout` — log out (protected)
- `POST /set-password` — set a password after OAuth signup (protected)
- `PATCH /preferences` — update theme and UI preferences (protected)
- `PATCH /profile` — update profile details (protected)
- `PATCH /change-password` — change the current password (protected)
- `DELETE /account` — delete the current account (protected)
- `GET /me` — get the authenticated user (protected)
- `GET /providers` — list available providers (protected)

### Health Metrics (`/api/health-metrics`)

- `POST /` — create a metric
- `GET /` — list metrics for the current user
- `GET /user/:userId` — list metrics for a specific user (provider or admin)
- `GET /latest` — get the latest reading per metric
- `GET /latest/:userId` — same, for a specific user
- `GET /daily-totals` — get aggregated daily totals
- `GET /daily-totals/:userId` — same, for a specific user
- `GET /stats` — get metric statistics
- `GET /stats/:userId` — same, for a specific user
- `GET /insights` — AI-generated insights from recent metrics
- `DELETE /:id` — delete a metric

### Appointments (`/api/appointments`)

- `POST /` — create an appointment
- `GET /` — list appointments
- `GET /provider/patients` — list a provider's patients
- `GET /availability/:providerId` — get provider availability
- `GET /:id` — get an appointment by ID
- `PATCH /:id` — update an appointment (provider)
- `POST /:id/cancel` — cancel an appointment

### Alerts (`/api/alerts`)

- `GET /` — list alerts
- `GET /unread-count` — get the unread alert count
- `PATCH /:id/read` — mark an alert as read
- `POST /:id/acknowledge` — acknowledge an alert
- `DELETE /:id` — delete an alert

### Messages (`/api/messages`)

- `POST /` — send a message
- `POST /upload` — upload a message attachment (image or document)
- `GET /conversations` — list conversations
- `GET /unread-count` — get the unread message count
- `GET /:userId` — get messages with a specific user
- `DELETE /:id` — delete a message

### AI Chatbot (`/api/chatbot`)

- `POST /message` — send a message to the assistant
- `GET /suggestions` — get suggested questions

### Google Fit (`/api/googlefit`)

- `GET /auth` — get the Google Fit OAuth URL
- `GET /callback` — Google Fit OAuth callback (public)
- `GET /status` — check connection status
- `POST /sync` — trigger a manual sync
- `POST /disconnect` — disconnect the Google Fit account

### Medications (`/api/medications`)

- `POST /` — create a medication
- `GET /` — list the current user's medications
- `GET /today` — get today's medication status
- `GET /stats` — get adherence statistics
- `GET /stats/:userId` — get adherence statistics for a specific user
- `GET /user/:userId` — list medications for a specific user
- `PUT /:id` — update a medication
- `DELETE /:id` — soft delete a medication
- `DELETE /:id/permanent` — permanently delete a medication
- `POST /:id/log` — log an adherence event

### Gamification (`/api/gamification`)

- `GET /stats` — get the current user's wellness score, challenges, and achievements
- `GET /stats/:userId` — get a patient's gamification stats (provider or admin)
- `GET /leaderboard` — get the top users by wellness score
- `POST /challenges/:id/claim` — claim a completed challenge reward

### Admin (`/api/admin`, admin only)

- `GET /stats` — get platform statistics
- `GET /users` — list all users
- `PUT /users/:id` — update a user
- `DELETE /users/:id` — delete a user
- `GET /audit-logs` — review audit logs
- `GET /system-metrics` — review aggregated system metrics

### Export (`/api/export`)

- `GET /csv` — export health data as CSV (supports `startDate`, `endDate`, `userId` query params)
- `GET /pdf` — export health data as PDF (supports `startDate`, `endDate`, `userId` query params)

### Feedback (`/api/feedback`)

- `POST /` — submit feedback
- `GET /` — review submitted feedback (admin only)

### Recipes (`/api/recipes`)

- `GET /` — list recipes (public)
- `GET /categories` — list recipe categories (public)
- `GET /:id` — get a recipe by ID (public)
- `POST /` — create a recipe (admin)
- `PUT /:id` — update a recipe (admin)
- `DELETE /:id` — delete a recipe (admin)

### Health Probe

- `GET /health` — liveness check returning server status and timestamp

## Project Structure

```
F29SO-/
├── client/                    # React frontend
│   ├── src/
│   │   ├── api/               # API client functions
│   │   ├── components/        # Feature-grouped React components
│   │   │   ├── appointments/
│   │   │   ├── chatbot/
│   │   │   ├── common/
│   │   │   ├── dashboard/
│   │   │   ├── export/
│   │   │   ├── gamification/
│   │   │   ├── health/
│   │   │   ├── medication/
│   │   │   ├── messages/
│   │   │   ├── patient/
│   │   │   ├── provider/
│   │   │   ├── ui/
│   │   │   └── wearables/
│   │   ├── context/           # React context providers
│   │   ├── data/              # Static data (e.g. FAQ)
│   │   ├── hooks/             # Custom hooks
│   │   ├── lib/               # Shared libraries
│   │   ├── pages/             # Page components and routes
│   │   ├── theme/             # Theme configuration
│   │   └── ui/                # Shared UI primitives
│   └── package.json
│
├── server/                    # Node.js backend
│   ├── config/                # Configuration files
│   ├── controllers/           # Route controllers
│   ├── middleware/            # Auth, upload, and other middleware
│   ├── models/                # Mongoose models
│   ├── routes/                # API routes
│   ├── services/              # External integrations and business logic
│   ├── utils/                 # Utility functions
│   ├── uploads/               # Stored message attachments (gitignored)
│   ├── seed-demo-data.js      # Demo account seeder
│   ├── server.js              # Express and Socket.IO entry point
│   └── package.json
│
├── start-medxi.ps1            # One-command dev startup (PowerShell)
├── start-medxi.bat            # One-command dev startup (cmd)
├── stop-medxi.ps1             # Stops the dev processes
├── stop-medxi.bat             # Stops the dev processes
├── backend-dev.ps1            # Backend dev launcher
├── frontend-dev.ps1           # Frontend dev launcher
└── README.md
```
