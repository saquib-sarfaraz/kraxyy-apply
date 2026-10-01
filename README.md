# Kraxyy Apply

> **Production-Ready Job Application Automation Platform**  
> Maintain one unified candidate profile, auto-fill repetitive application forms on Greenhouse, Lever, Workday, and custom career portals using our Chrome Extension (Manifest V3), review every field with total control, and track your career pipeline from one dashboard.

---

## Brand Design System

Kraxyy Apply adheres to a strict, curated color palette:
- **Cream:** `#F4EFE4` (Dominant page background & canvas)
- **Olive:** `#525B31` (Primary brand action, buttons, headers)
- **Mustard:** `#B18B40` (Highlights, active accents, focus states)
- **Beige:** `#D6CAAC` (Secondary cards, borders, dividers)
- Neutral darks (`#1E2315`) for high-contrast, accessible typography.

---

## Core Architecture Decision: Safety First

Unlike rogue auto-submit bots that get flagged or submit incomplete answers:
1. The extension **detects** form fields via a multi-signal DOM taxonomy engine.
2. The extension **fills** compatible fields from the user's verified Kraxyy profile.
3. The extension **presents an on-page audit breakdown** (✓ Filled, ⚠ Needs Review, ○ Unmapped).
4. **The user reviews and manually clicks the employer's submit button.**

---

## Monorepo Layout

```text
/Kraxyy Apply
├── packages/
│   ├── types/          # Shared TypeScript domain interfaces, taxonomy, API contracts
│   ├── validation/     # Shared Zod validation schemas (Auth, Profile, Application)
│   └── shared/         # Brand design tokens, field taxonomy synonyms, endpoints
├── services/
│   └── api/            # Production Node.js + Express + TypeScript + Mongoose API
├── apps/
│   ├── web/            # Candidate Web Application (React 18 + Vite + Tailwind + TanStack Query)
│   ├── admin/          # Administrator Console (React 18 + Vite + Tailwind + Recharts)
│   └── extension/      # Chrome Extension Manifest V3 (Service Worker + Content Scripts + Popup)
└── docs/               # System architecture, database, API, security, and deployment specs
```

---

## Quick Start (Local Development)

### 1. Prerequisites
- Node.js `v20+` or `v22+`
- npm `v10+`
- MongoDB running locally or a MongoDB Atlas connection URI

### 2. Environment Configuration
Copy the `.env.example` file to `services/api/.env`:
```bash
cp .env.example services/api/.env
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Seed Database
Seed the database with admin user, demo candidate, sample resumes, 5 active jobs, and 4 pipeline applications:
```bash
npm run seed
```
**Default Credentials:**
- **Candidate User:** `demo@kraxyy.com` / `DemoPass123!`
- **Administrator:** `admin@kraxyy.com` / `AdminPass123!`

### 5. Start Development Servers
```bash
# Start API (port 5001), Web App (port 5173), and Admin Console (port 5174)
npm run dev
```

- **Candidate Web App:** [http://localhost:5173](http://localhost:5173)
- **Admin Console:** [http://localhost:5174](http://localhost:5174)
- **Backend API:** [http://localhost:5001/api/v1](http://localhost:5001/api/v1)
- **Health Check:** [http://localhost:5001/health](http://localhost:5001/health)

---

## Loading the Chrome Extension

1. Build the extension:
   ```bash
   npm --workspace=@kraxyy/extension run build
   ```
2. In Google Chrome, open `chrome://extensions`.
3. Enable **Developer mode** in the upper right.
4. Click **Load unpacked** and select `apps/extension/dist`.
5. Open your Kraxyy Apply web app at `http://localhost:5173/extension` to generate a 6-digit pair code.
6. Click the Kraxyy Apply extension icon in your browser toolbar, enter the code, and your profile will sync.

---

## Production Builds

```bash
# Typecheck all packages
npm run typecheck

# Run unit and integration tests
npm run test

# Build all production targets
npm run build
```

---

## Documentation

Full architectural documentation is available in the [`/docs`](file:///Users/saquibsarfaraz/Kraxyy%20Apply%20/docs) directory:
- [Architecture & Topology](file:///Users/saquibsarfaraz/Kraxyy%20Apply%20/docs/architecture.md)
- [Database & Indexes](file:///Users/saquibsarfaraz/Kraxyy%20Apply%20/docs/database.md)
- [REST API Specification](file:///Users/saquibsarfaraz/Kraxyy%20Apply%20/docs/api.md)
- [Extension Lifecycle & Adapters](file:///Users/saquibsarfaraz/Kraxyy%20Apply%20/docs/extension.md)
- [Security & Compliance](file:///Users/saquibsarfaraz/Kraxyy%20Apply%20/docs/security.md)
- [Production Deployment Guide](file:///Users/saquibsarfaraz/Kraxyy%20Apply%20/docs/deployment.md)
- [Supported ATS Platforms](file:///Users/saquibsarfaraz/Kraxyy%20Apply%20/docs/supported-sites.md)
