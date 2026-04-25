import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixUserDataMapping() {
  console.log('🔧 Starting user data mapping fix...');
  
  try {
    // 1. Check for orphaned application_tracker entries
    const { data: trackers, error: trackersError } = await supabase
      .from('application_tracker')
      .select('user_id, step_label')
      .limit(5);
    
    if (trackersError) {
      console.error('Error fetching trackers:', trackersError);
      return;
    }

    console.log('📊 Sample tracker entries:', trackers);

    // 2. Check user_roles table structure
    const { data: users, error: usersError } = await supabase
      .from('user_roles')
      .select('id, user_id, name, email, role')
      .limit(5);
      
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }

    console.log('👤 Sample user entries:', users);

    // 3. Find orphaned tracker entries
    if (trackers.length > 0 && users.length > 0) {
      const userIds = new Set(users.map(u => u.id));
      const trackerUserIds = new Set(trackers.map(t => t.user_id));
      
      console.log('🔍 User IDs in user_roles:', Array.from(userIds));
      console.log('🔍 User IDs in application_tracker:', Array.from(trackerUserIds));
      
      // Find mismatches
      const orphanedTrackers = Array.from(trackerUserIds).filter(id => !userIds.has(id));
      const missingTrackers = Array.from(userIds).filter(id => !trackerUserIds.has(id));
      
      console.log('🚨 Orphaned tracker entries (no matching user):', orphanedTrackers);
      console.log('📝 Users without tracker entries:', missingTrackers);

      // 4. Fix orphaned entries by creating missing user_roles entries
      for (const orphanedId of orphanedTrackers) {
        console.log(`Creating user_roles entry for orphaned tracker user_id: ${orphanedId}`);
        
        // Try to find this user in auth.users (if possible)
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({
            id: orphanedId,
            user_id: orphanedId,
            name: `User ${orphanedId.substring(0, 8)}`, // Fallback name
            email: `user${orphanedId.substring(0, 8)}@example.com`, // Fallback email
            role: 'student'
          });

        if (insertError) {
          console.error(`Failed to create user_roles entry for ${orphanedId}:`, insertError);
        } else {
          console.log(`✅ Created user_roles entry for ${orphanedId}`);
        }
      }

      // 5. Create application tracker for users who don't have it
      for (const userId of missingTrackers) {
        console.log(`Creating application tracker for user: ${userId}`);
        
        try {
          const response = await fetch('http://localhost:5174/api/create-user-tracker', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: userId,
              target_countries: ['USA'] // Default country
            })
          });

          const result = await response.json();
          if (!response.ok) {
            console.error('Error creating tracker:', result);
          } else {
            console.log(`✅ Created tracker for user ${userId}`);
          }
        } catch (error) {
          console.error(`Failed to create tracker for ${userId}:`, error);
        }
      }
    }

    console.log('✅ User data mapping fix completed!');
  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

// Run the fix
fixUserDataMapping();
