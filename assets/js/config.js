/*
 * Connection to the Supabase project that holds the catalogue and runs the admin panel.
 *
 * Fill both values in from the Supabase dashboard (Project Settings > API Keys):
 *   supabaseUrl  the Project URL, like https://abcdefghijkl.supabase.co
 *   supabaseKey  the publishable key (or the older "anon public" key)
 *
 * Both are meant to be public. The database's own rules (supabase/schema.sql) decide
 * who may change anything. Never put the "secret" or "service_role" key here.
 *
 * While these are empty the shop shows the products written in data.js, and the
 * admin panel explains how to connect.
 */
window.MW_CONFIG = {
  supabaseUrl: 'https://ylivgkwjuevqefaaygcd.supabase.co',
  supabaseKey: 'sb_publishable_p1uxkfoi4DvR53ZO4WXAaQ_7llaR4x5',
};
