# Events, Careers & Podcasts System Documentation

> **File Path:** `docs/FEATURES_EVENTS_CAREERS_README.md`
>
> This file was generated to be added into the existing project structure. Replace TODO placeholders (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, STORAGE_BUCKET_NAME, ADMIN_SECRET) with real values. For production, use server-side-only keys for create/update APIs; the public site should only use anon/read policies.

## Overview

This system provides a complete end-to-end solution for managing:
- **Events** - Workshops, conferences, webinars, and fairs
- **Podcasts** ("The Story") - Video podcast episodes featuring student stories
- **Careers** - Job postings and career opportunities
- **Applications** - Both job applications and event registrations

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      PUBLIC PAGES                                │
│  EventsPage.jsx  │  CareersPage.jsx                             │
└────────┬────────────────────┬────────────────────────────────────┘
         │                    │
         ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API ROUTES                                  │
│  /api/public/events  │  /api/public/podcasts  │  /api/apply     │
│  /api/public/careers │                                          │
└────────┬────────────────────┬────────────────────────────────────┘
         │                    │
         ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE DATABASE                             │
│  events  │  podcasts  │  careers  │  applications               │
└─────────────────────────────────────────────────────────────────┘
         ▲                    ▲
         │                    │
┌────────┴────────────────────┴────────────────────────────────────┐
│                      ADMIN API ROUTES                            │
│  /api/admin/events  │  /api/admin/podcasts                      │
│  /api/admin/careers │  /api/admin/applications                  │
└────────┬────────────────────┬────────────────────────────────────┘
         │                    │
         ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN DASHBOARD                               │
│  AdminDashboard.jsx (Events, Podcasts, Careers, Applications)   │
└─────────────────────────────────────────────────────────────────┘
```

## Environment Variables Required

Add these to your `.env` file:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Server-side only (for API routes)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Backend URL for API calls
VITE_BACKEND_URL=https://your-backend-url.vercel.app

# Storage (for file uploads)
STORAGE_BUCKET_NAME=applications

# Optional: Admin authentication
ADMIN_SECRET=your-admin-secret-key
```

## Applying the SQL Migration

### Option 1: Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase_migrations/2025-12_add_events_careers_podcasts_applications.sql`
4. Paste and run the SQL

### Option 2: Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Run the migration
supabase db push
```

### Option 3: Direct PostgreSQL Connection

```bash
psql -h db.your-project.supabase.co -p 5432 -U postgres -d postgres < supabase_migrations/2025-12_add_events_careers_podcasts_applications.sql
```

## Supabase RLS (Row Level Security) Configuration

The migration includes RLS policies, but here's a summary of what they do:

### Events Table
- **Public Read**: Anyone can read published events (`is_published = true`)
- **Admin Full Access**: Admins/advisors can create, read, update, delete all events

### Podcasts Table
- **Public Read**: Anyone can read published podcasts (`is_published = true`)
- **Admin Full Access**: Admins/advisors can manage all podcasts

### Careers Table
- **Public Read**: Anyone can read published job postings (`is_published = true`)
- **Admin Full Access**: Admins/advisors can manage all job postings

### Applications Table
- **Public Insert**: Anyone can submit applications (job applications or event registrations)
- **Admin Read/Update**: Only admins/advisors can view and update application statuses

## Admin Dashboard Integration

The admin dashboard (`src/pages/AdminDashboard.jsx`) now includes four management sections accessible via tabs:

1. **Events Manager** - Create, edit, delete, publish/unpublish events
2. **Podcasts Manager** - Manage podcast episodes with YouTube integration
3. **Careers Manager** - Job postings with responsibilities/requirements repeaters
4. **Applications Manager** - View and update status of all applications

### Accessing Admin Features

1. Login as an admin or advisor user
2. Navigate to `/admin-dashboard`
3. Use the tab navigation to switch between management sections

## Public Pages

### Events Page (`/events`)

Features:
- Hero section with statistics
- Filters: category, mode, date, search
- Upcoming events grid
- Event detail modal with registration form
- "The Story" podcast strip
- Past events gallery

### Careers Page (`/careers`)

Features:
- Hero section with job statistics
- Filters: department, location, job type
- Job listings with cards
- Job detail modal
- Application form with resume upload
- "Why Join Us" section

## API Endpoints

### Public Endpoints (No Auth Required)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/public/events` | GET | List published events |
| `/api/public/podcasts` | GET | List published podcasts |
| `/api/public/careers` | GET | List published job postings |
| `/api/apply` | POST | Submit application (job or event) |

### Admin Endpoints (Auth Required)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/events` | GET, POST, PUT, DELETE | Full CRUD for events |
| `/api/admin/podcasts` | GET, POST, PUT, DELETE | Full CRUD for podcasts |
| `/api/admin/careers` | GET, POST, PUT, DELETE | Full CRUD for careers |
| `/api/admin/applications` | GET, PUT | List and update applications |

### Query Parameters

**Events (`/api/public/events`):**
- `category` - Filter by category (conference, workshop, etc.)
- `mode` - Filter by mode (online, in-person, hybrid)
- `upcoming` - Set to "true" for future events only
- `featured` - Set to "true" for featured events only
- `slug` - Get single event by slug
- `limit` - Number of results (default: 50)

**Podcasts (`/api/public/podcasts`):**
- `slug` - Get single podcast by slug
- `latest` - Set to "true" for latest episode only
- `limit` - Number of results (default: 20)

**Careers (`/api/public/careers`):**
- `department` - Filter by department
- `location` - Filter by location
- `job_type` - Filter by job type
- `featured` - Set to "true" for featured jobs only
- `slug` - Get single job by slug
- `limit` - Number of results (default: 50)

## Data Flow

### Event Registration Flow
1. User visits `/events` page
2. User clicks on an event card → Modal opens
3. User fills registration form
4. Form submits to `/api/apply` with `type: "event_registration"`
5. Application created in `applications` table
6. Event's `registered_count` incremented

### Job Application Flow
1. User visits `/careers` page
2. User clicks on a job card → Modal opens
3. User clicks "Apply Now" → Application form shown
4. User fills form (with optional resume upload)
5. Form submits to `/api/apply` with `type: "job_application"`
6. Application created in `applications` table

### Admin Management Flow
1. Admin logs in and goes to `/admin-dashboard`
2. Selects tab (Events, Podcasts, Careers, Applications)
3. Can create, edit, delete, publish/unpublish items
4. For applications: can update status (submitted → reviewed → shortlisted/rejected)

## File Structure

```
elite/
├── src/
│   ├── pages/
│   │   ├── EventsPage.jsx          # Public events + podcasts page
│   │   ├── CareersPage.jsx         # Public careers page
│   │   └── AdminDashboard.jsx      # Modified with new managers
│   ├── components/
│   │   └── ui/
│   │       └── VerticalSidebar.jsx # Updated with new nav items
│   └── App.jsx                     # Updated with new routes
├── api/
│   ├── admin/
│   │   ├── events.js               # Events CRUD
│   │   ├── careers.js              # Careers CRUD
│   │   ├── podcasts.js             # Podcasts CRUD
│   │   └── applications.js         # Applications list/update
│   ├── public/
│   │   ├── events.js               # Public events read
│   │   ├── podcasts.js             # Public podcasts read
│   │   └── careers.js              # Public careers read
│   └── apply.js                    # Unified application endpoint
├── supabase_migrations/
│   ├── 2025-12_add_events_careers_podcasts_applications.sql
│   └── schema_mapping_events_careers_podcasts_applications.json
└── docs/
    └── FEATURES_EVENTS_CAREERS_README.md
```

## Design Tokens

The pages use consistent Elite Scholars branding:

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#D72E2D` | Buttons, accents, CTAs |
| Dark Navy | `#0B0E32` | Headers, dark backgrounds |
| Text | `#141414` | Body text |
| Card Background | `#D6DAFF` | Card backgrounds, highlights |
| Muted | `#636363` | Secondary text |
| White | `#FFFFFF` | Backgrounds |

**Typography:**
- Body: Inter, system fonts
- Headings: Playfair Display, Georgia (serif fallback)

## Mock Data Fallback

Both `EventsPage.jsx` and `CareersPage.jsx` include mock data that's used when:
- Supabase keys are not configured
- API calls fail
- Development/testing without database

This ensures the pages always render properly even without a database connection.

## TODO Items

- [ ] Implement proper admin authentication (JWT, session-based)
- [ ] Set up Supabase Storage bucket for resume uploads
- [ ] Configure SendGrid for confirmation emails
- [ ] Add image upload functionality to admin forms
- [ ] Implement pagination for large datasets
- [ ] Add analytics tracking for events and applications

## Troubleshooting

### Tables Not Created
Make sure you run the full SQL migration and that your Supabase user has permissions to create tables.

### RLS Blocking Requests
Check that RLS policies are correctly applied. For development, you can temporarily disable RLS:
```sql
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
```

### API Routes Not Working
Ensure your `server.mjs` includes the new route handlers. Check that environment variables are correctly set.

### Mock Data Showing Instead of Real Data
This usually means the API request is failing. Check:
1. `VITE_BACKEND_URL` is correctly set
2. Supabase credentials are valid
3. Tables exist and contain data
