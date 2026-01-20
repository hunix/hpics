-- Fix Dossier Intelligence visibility by removing it from hidden_items
-- This removes 'dossier-intelligence' from all users' hidden_items arrays

UPDATE navigation_preferences
SET hidden_items = array_remove(hidden_items, 'dossier-intelligence')
WHERE 'dossier-intelligence' = ANY(hidden_items);

-- Verify the update
SELECT user_id, hidden_items 
FROM navigation_preferences 
WHERE hidden_items IS NOT NULL AND array_length(hidden_items, 1) > 0;
