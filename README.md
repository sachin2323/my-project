# Senior & Volunteer Care Apps

This monorepo contains two PWAs:
1. `/senior` - Voice-first interface for seniors.
2. `/volunteer` - Dashboard for volunteers.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Supabase Setup:**
   - Create a new Supabase project.
   - Run the SQL in `schema.sql` in the Supabase SQL Editor to create tables.
   - Get your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

3. **Environment Variables:**
   - Create `.env` files in `apps/senior` and `apps/volunteer`:
     ```
     VITE_SUPABASE_URL=your_supabase_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

## Running the Apps

- **Senior App:**
  ```bash
  cd apps/senior
  npm run dev
  ```
  Access at `http://localhost:5173`.

- **Volunteer App:**
  ```bash
  cd apps/volunteer
  npm run dev
  ```
  Access at `http://localhost:5174` (port may vary).

## Features

- **Senior App:**
  - Voice Commands: "Suno Play Show", "Call Buddy", "Help", "SOS".
  - Multi-step Registration with Audio Prompt.
  - Large Buttons & High Contrast UI.
  - Screen Wake Lock.

- **Volunteer App:**
  - Realtime Dashboard for Calls & SOS Alerts.
  - Call Logging with Voice-to-Text.

## Browser Support
- Voice features require a browser with Web Speech API support (Chrome, Edge, Safari).
- Screen Wake Lock works on supported browsers over HTTPS or localhost.
