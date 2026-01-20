import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yibszncvwmefwamayfty.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpYnN6bmN2d21lZndhbWF5ZnR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NDgyNDUsImV4cCI6MjA4MzAyNDI0NX0.GP7FB9tmWEtfc4r1azsbBzD8Fx12cQD7exz8A6k86vI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDossierVisibility() {
    console.log('🔍 Checking navigation preferences...\n');

    // Fetch all navigation preferences
    const { data: before, error: beforeError } = await supabase
        .from('navigation_preferences')
        .select('user_id, hidden_items');

    if (beforeError) {
        console.error('❌ Error fetching current state:', beforeError);
        return;
    }

    console.log(`Found ${before?.length || 0} users with navigation preferences`);

    const usersWithHidden = before?.filter(pref =>
        pref.hidden_items && Array.isArray(pref.hidden_items) && pref.hidden_items.includes('dossier-intelligence')
    );

    console.log(`Found ${usersWithHidden?.length || 0} users with 'dossier-intelligence' hidden\n`);

    if (usersWithHidden && usersWithHidden.length > 0) {
        console.log('📝 Updating preferences...\n');

        for (const user of usersWithHidden) {
            const updatedItems = user.hidden_items.filter(item => item !== 'dossier-intelligence');

            const { error: updateError } = await supabase
                .from('navigation_preferences')
                .update({ hidden_items: updatedItems })
                .eq('user_id', user.user_id);

            if (updateError) {
                console.error(`❌ Error updating user ${user.user_id}:`, updateError);
            } else {
                console.log(`✅ Updated user ${user.user_id}: removed 'dossier-intelligence' from hidden items`);
            }
        }

        console.log('\n🎉 Fix completed! All users can now see Dossier Intelligence in navigation.');
    } else {
        console.log('✅ No users have dossier-intelligence hidden. The page should already be visible!');
    }

    // Verify the result
    const { data: after } = await supabase
        .from('navigation_preferences')
        .select('user_id, hidden_items');

    const stillHidden = after?.filter(pref =>
        pref.hidden_items && Array.isArray(pref.hidden_items) && pref.hidden_items.includes('dossier-intelligence')
    );

    console.log(`\n✔️  Verification: ${stillHidden?.length || 0} users still have it hidden (should be 0)`);
    console.log('\n💡 Please refresh your browser (Ctrl+Shift+R or Cmd+Shift+R) to see the changes.');
}

fixDossierVisibility()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
