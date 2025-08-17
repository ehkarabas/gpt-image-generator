#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(process.cwd(), '.env.production') });

async function checkRemoteTrigger() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing Supabase credentials in .env.production');
    process.exit(1);
  }

  console.log('📡 Connecting to remote Supabase...');
  console.log('URL:', supabaseUrl);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    // Test the actual workflow
    console.log('\n🧪 Testing profile creation workflow...');
    
    // Create a test user
    const testEmail = `trigger-test-${Date.now()}@example.com`;
    const testPassword = 'Test-Password-123!';
    
    console.log(`Creating test user: ${testEmail}`);
    const { data: user, error: createError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    });

    if (createError) {
      console.error('❌ Failed to create test user:', createError.message);
      return;
    }

    console.log('✅ Test user created:', user.user.id);

    // Check if profile was created by trigger (wait a bit for trigger to execute)
    console.log('\n🔍 Checking if trigger created profile...');
    
    let profileFound = false;
    let profile = null;
    
    // Try multiple times with increasing delays
    for (let attempt = 0; attempt < 5; attempt++) {
      const delay = (attempt + 1) * 1000; // 1s, 2s, 3s, 4s, 5s
      console.log(`   Attempt ${attempt + 1}/5 (waiting ${delay}ms)...`);
      await new Promise(r => setTimeout(r, delay));
      
      const { data: checkProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.user.id)
        .single();
      
      if (checkProfile) {
        profileFound = true;
        profile = checkProfile;
        break;
      }
    }

    if (!profileFound) {
      console.error('❌ Profile not found after 5 attempts - trigger is NOT working');
      console.log('\n🔧 Creating profile manually...');
      
      const { data: manualProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.user.id,
          email: testEmail,
          display_name: 'Test User',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('❌ Manual profile creation failed:', insertError.message);
      } else {
        console.log('✅ Manual profile creation succeeded');
        profile = manualProfile;
      }
    } else {
      console.log('✅ Profile found - trigger IS working!');
      console.log('   Profile ID:', profile.id);
      console.log('   Email:', profile.email);
    }

    // Try to create a conversation
    if (profile) {
      console.log('\n🧪 Testing conversation creation...');
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          title: 'Trigger Test Conversation',
          user_id: user.user.id
        })
        .select()
        .single();

      if (convError) {
        console.error('❌ Conversation creation failed:', convError.message);
        if (convError.message.includes('foreign key')) {
          console.error('   ⚠️  FK constraint issue detected!');
        }
      } else {
        console.log('✅ Conversation created successfully!');
        console.log('   Conversation ID:', conversation.id);
        
        // Cleanup conversation
        await supabase.from('conversations').delete().eq('id', conversation.id);
      }
    }

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    if (profile) {
      await supabase.from('profiles').delete().eq('id', user.user.id);
    }
    await supabase.auth.admin.deleteUser(user.user.id);
    console.log('✅ Test data cleaned up');

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('SUMMARY:');
    console.log('  Trigger working:', profileFound ? '✅ YES' : '❌ NO');
    console.log('  Manual profile creation:', profile ? '✅ SUCCESS' : '❌ FAILED');
    console.log('  Conversation creation:', profile ? '✅ SUCCESS' : '⚠️  NOT TESTED');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkRemoteTrigger().then(() => {
  console.log('\n✅ Remote trigger check completed');
  process.exit(0);
}).catch(err => {
  console.error('❌ Check failed:', err);
  process.exit(1);
});
