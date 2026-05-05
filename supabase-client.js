const SUPABASE_URL = 'https://vqemtpvgnfwpukdvuzyo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_kVfiwbbPSMshfRs1PkTtow_o4TWeXNy';


const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
