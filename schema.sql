-- Users Elderly Table
create table public.users_elderly (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  primary_language text not null, -- 'Hindi', 'English', etc.
  interests text[] default '{}',
  emergency_contact_1 text,
  emergency_contact_2 text,
  buddy_whatsapp_number text
);

-- Calls Log Table
create table public.calls_log (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  caller_id uuid references public.users_elderly(id),
  type text not null, -- 'video', 'voice'
  status text not null, -- 'initiated', 'in_progress', 'completed'
  buddy_number text,
  summary text -- Voice-to-text summary from volunteer
);

-- Requests Table (Ask Help)
create table public.requests (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references public.users_elderly(id),
  status text default 'open' -- 'open', 'resolved'
);

-- SOS Alerts Table
create table public.sos_alerts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references public.users_elderly(id),
  status text default 'active' -- 'active', 'resolved'
);

-- Enable Realtime
alter publication supabase_realtime add table public.calls_log;
alter publication supabase_realtime add table public.sos_alerts;
alter publication supabase_realtime add table public.requests;
