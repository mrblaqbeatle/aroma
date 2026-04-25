// ══════════════════════════════════════════════════════
//  supabase-client.js — shared Supabase client instance
//  Import this before any other Aroma JS file.
//
//  SETUP: Replace the two values below with your own
//  from: Supabase Dashboard → Project Settings → API
// ══════════════════════════════════════════════════════

const SUPABASE_URL = 'https://vqemtpvgnfwpukdvuzyo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_kVfiwbbPSMshfRs1PkTtow_o4TWeXNy';

// Loaded via CDN <script> tag — window.supabase is available
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
