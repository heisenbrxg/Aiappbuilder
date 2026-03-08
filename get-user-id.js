// Script to get user ID from the database
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function getUserId() {
  try {
    // Create Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
    );
    
    console.log('Fetching users from database...');
    
    // Get users from the database
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('user_id, plan_id, status')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    if (data && data.length > 0) {
      console.log('\nFound users with subscriptions:');
      data.forEach((sub, index) => {
        console.log(`${index + 1}. User ID: ${sub.user_id} | Plan: ${sub.plan_id} | Status: ${sub.status}`);
      });
    } else {
      console.log('No users found with subscriptions.');
      
      // Try to get users from auth.users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (usersError) {
        console.error('Error fetching users:', usersError);
      } else if (users && users.length > 0) {
        console.log('\nFound users in auth table:');
        users.forEach((user, index) => {
          console.log(`${index + 1}. User ID: ${user.id} | Email: ${user.email}`);
        });
      } else {
        console.log('No users found in the database.');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

getUserId(); 