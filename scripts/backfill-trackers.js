// scripts/backfill-trackers.js
// Script to create missing trackers for existing users
const fetch = require('node-fetch');

async function backfillTrackers() {
  try {
    console.log('🔄 Starting tracker backfill process...');
    
    const response = await fetch('https://elite-scholars-eight.vercel.app/api/backfill-trackers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Backfill completed successfully!');
      console.log(result.message);
      console.log(`📊 Processed ${result.usersProcessed} users`);
      
      if (result.results && result.results.length > 0) {
        console.log('\n📋 Results:');
        result.results.forEach(r => {
          if (r.success) {
            console.log(`✅ ${r.user_id}: Success`);
          } else {
            console.log(`❌ ${r.user_id}: ${r.error}`);
          }
        });
      }
    } else {
      console.error('❌ Backfill failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Script error:', error.message);
  }
}

// Run the script
backfillTrackers();