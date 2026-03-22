import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Creating user_settings table...");
  const sql = `
    CREATE TABLE IF NOT EXISTS user_settings (
      id integer PRIMARY KEY,
      display_name text,
      avatar_url text
    );
  `;
  // We can't execute raw sql via standard JS client easily unless we use rpc.
  // Wait, let's just insert a row to see if it exists.
  const { data, error } = await supabase.from('user_settings').select('*');
  console.log("Check if exists:", error ? error.message : "Exists!");
}

main();
