// Script to remove 'dossier-intelligence' from hidden_items in navigation_preferences
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://yibszncvwmefwamayfty.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpYnN6bmN2d21lZndhbWF5ZnR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NDgyNDUsImV4cCI6MjA4MzAyNDI0NX0.GP7FB9tmWEtfc4r1azsbBzD8Fx12cQD7exz8A6k86vI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDossierVisibility() {
    console.log('Removing dossier-intelligence from hidden_items...');

    // First, let's see what we have
    const { data: before, error: beforeError } = await supabase
        .from('navigation_preferences')
        .select('user_id, hidden_items')
        .not('hidden_items', 'is', null);

    if (beforeError) {
        console.error('Error fetching current state:', beforeError);
        return;
    }

    console.log(`Found ${before?.length || 0} users with navigation preferences`);

    const usersWithHidden = before?.filter(pref =>
        pref.hidden_items?.includes('dossier-intelligence')
    );

    console.log(`Found ${usersWithHidden?.length || 0} users with 'dossier-intelligence' hidden`);

    if (usersWithHidden && usersWithHidden.length > 0) {
        // Update each user's preferences
        for (const user of usersWithHidden) {
            const updatedItems = user.hidden_items.filter(item => item !== 'dossier-intelligence');

            const { error: updateError } = await supabase
                .from('navigation_preferences')
                .update({ hidden_items: updatedItems })
                .eq('user_id', user.user_id);

            if (updateError) {
                console.error(`Error updating user ${user.user_id}:`, updateError);
            } else {
                console.log(`✓ Updated user ${user.user_id}: removed 'dossier-intelligence' from hidden items`);
            }
        }

        console.log('\n✅ Fix completed! All users can now see Dossier Intelligence in navigation.');
    } else {
        console.log('✓ No users have dossier-intelligence hidden. The page should be visible!');
    }

    // Verify the result
    const { data: after } = await supabase
        .from('navigation_preferences')
        .select('user_id, hidden_items')
        .not('hidden_items', 'is', null);

    const stillHidden = after?.filter(pref =>
        pref.hidden_items?.includes('dossier-intelligence')
    );

    console.log(`\nVerification: ${stillHidden?.length || 0} users still have it hidden (should be 0)`);
}

fixDossierVisibility()
    .then(() => {
        console.log('\nScript completed successfully!');
        console.log('Please refresh your browser to see the changes.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Script failed:', error);
        process.exit(1);
    });
