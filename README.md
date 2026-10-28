# Resource Hub – Frontend

A React single-page app for browsing resources, booking dates, and tracking bookings. Admins can also create resources and view booking stats across all users.

- **Backend repository:** https://github.com/Keshav5173/resourceBooking_backend
- **Frontend repository:** https://github.com/Keshav5173/resourceBooking_frontend

> This is the frontend only. Set up and start the backend first (see its README), then follow the steps below

## Features

**All users**
- Sign in and sign out, with a profile panel showing name, email, and role.
- Resource dashboard with a "Free today" / "Booked today" indicator on each resource.
- Calendar-based booking: choose a resource, pick a date, and confirm.
- Booking history for the signed-in user, newest first, with Upcoming / Past filters.
- Loading skeletons, empty states, and clear success and error messages throughout.
- Responsive layout for desktop, tablet, and mobile, with a slide-out navigation menu.

**Admins only** (`role === "admin"`)
- Create resource page (name and details) with live preview and validation.
- Booking stats page covering all users and resources: summary cards, a per-resource breakdown, and a table with filters for date, status, resource, and user search.
- Admin-only menu items are hidden from regular users.

**Booking status lifecycle** (updated by a backend scheduled job)
`PENDING` → `ONBOARDED` (on the booking date) → `COMPLETED` (after the booking date)

## Tech stack

| Area | Technology |
| --- | --- |
| UI | React 19 (functional components and Hooks) |
| Build tool | Vite |
| Styling | Tailwind CSS v4 |
| Routing | React Router v7 |
| HTTP client | Axios |
| Cookies | js-cookie |
| Linting | ESLint |

## Prerequisites

- Node.js 20.19 or newer, with npm
- The backend running locally or deployed (it needs MongoDB; see the backend README)

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/Keshav5173/resourceBooking_frontend.git
cd resourceBooking_frontend

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.example .env     # on Windows: copy .env.example .env

# 4. Start the development server
npm run dev
```

The app runs at **http://localhost:5173** by default.

## Environment variables

Create a `.env` file in the project root:


Restart the dev server after changing `.env`. Only variables prefixed with `VITE_` are exposed to the browser.


## Available scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the Vite dev server with hot reload |
| `npm run build` | Builds the production bundle into `dist/` |


## Routes

| Path | Page | Access |
| --- | --- | --- |
| `/` | Dashboard (resources and booking) | Signed-in users |
| `/previousbooking` | Booking history | Signed-in users |
| `/createresource` | Create resource | Admin |
| `/bookingstats` | Booking stats | Admin |


## Project structure


```
src/
├── assets/          # Logos and images
├── components/      # Reusable UI (e.g. ErrorComponent)
├── pages/           # Dashboard, BookingHistory, CreateResource, BookingStats, BookingCalendar
├── services/        # Axios instance and API functions (auth, booking)
├── App.jsx          # Routes
└── main.jsx         # App entry
```

## Project explanation

I built the frontend as a Vite and React app made of functional components and Hooks, styled with Tailwind CSS and responsive from mobile to desktop. Each page has its own state for loading, empty, success, and error cases, and all API calls go through a `services` layer that wraps Axios and turns server errors into readable messages. Users browse resources on the dashboard and book a date from a calendar modal, then review their bookings on a history page with Upcoming and Past filters. Admins get extra pages for creating resources and viewing booking stats with filters by date, status, resource, and user, and their menu items only show for the admin role. The backend uses Express, MongoDB, and Mongoose, and a scheduled job moves bookings from PENDING to ONBOARDED to COMPLETED each day. With more time I would add server-side pagination and sorting for the history and stats pages so they stay fast with large amounts of data.

## Author

Keshav Bhardwaj