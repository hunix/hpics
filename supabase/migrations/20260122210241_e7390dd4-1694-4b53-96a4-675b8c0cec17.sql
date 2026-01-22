-- Create bulk update function for thread message counts
CREATE OR REPLACE FUNCTION public.bulk_update_thread_counts(
  thread_updates jsonb
) RETURNS void AS $$
BEGIN
  UPDATE email_threads t
  SET 
    message_count = COALESCE(t.message_count, 0) + (update_data->>'count')::int,
    updated_at = now()
  FROM jsonb_array_elements(thread_updates) AS update_data
  WHERE t.id = (update_data->>'id')::uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;