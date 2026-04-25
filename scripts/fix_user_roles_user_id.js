import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixUserRolesUserId() {
  const { data: rows, error } = await supabase
    .from('user_roles')
    .select('id, user_id')
    .is('user_id', null);
  if (error) {
    console.error('Error fetching rows:', error);
    return;
  }
  for (const row of rows) {
    const { id } = row;
    const { error: updateError } = await supabase
      .from('user_roles')
      .update({ user_id: id })
      .eq('id', id);
    if (updateError) {
      console.error(`Failed to update user_id for id ${id}:`, updateError);
    } else {
      console.log(`Updated user_id for id ${id}`);
    }
  }
  console.log('Done fixing user_roles user_id values.');
}

fixUserRolesUserId();
