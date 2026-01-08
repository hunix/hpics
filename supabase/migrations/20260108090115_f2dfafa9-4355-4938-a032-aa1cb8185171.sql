-- Phase 1.1: Auto-Enrichment Pipeline Database Triggers

-- Function: Queue message for enrichment when new message is inserted
CREATE OR REPLACE FUNCTION public.queue_message_for_enrichment()
RETURNS trigger AS $$
BEGIN
  -- Only queue messages with substantial content (50+ chars)
  IF length(COALESCE(NEW.content, '')) > 50 THEN
    INSERT INTO bulk_operation_queue (
      user_id,
      operation_type,
      target_ids,
      total_items,
      status,
      metadata
    )
    SELECT 
      c.user_id,
      'message_enrichment',
      ARRAY[NEW.id::text],
      1,
      'pending',
      jsonb_build_object(
        'conversation_id', NEW.conversation_id,
        'priority', 5,
        'auto_triggered', true,
        'content_length', length(NEW.content)
      )
    FROM conversations c 
    WHERE c.id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger: Auto-queue messages for enrichment
DROP TRIGGER IF EXISTS trg_queue_message_enrichment ON messages;
CREATE TRIGGER trg_queue_message_enrichment
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION queue_message_for_enrichment();

-- Function: Queue media for AI analysis when new media is inserted
CREATE OR REPLACE FUNCTION public.queue_media_for_analysis()
RETURNS trigger AS $$
BEGIN
  -- Only queue images and videos for analysis
  IF NEW.mime_type LIKE 'image/%' OR NEW.mime_type LIKE 'video/%' THEN
    INSERT INTO bulk_operation_queue (
      user_id,
      operation_type,
      target_ids,
      total_items,
      status,
      metadata
    ) VALUES (
      NEW.user_id,
      'media_analysis',
      ARRAY[NEW.id::text],
      1,
      'pending',
      jsonb_build_object(
        'media_type', NEW.mime_type,
        'profile_id', NEW.profile_id,
        'priority', 3,
        'auto_triggered', true,
        'file_size', NEW.file_size
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger: Auto-queue media for analysis
DROP TRIGGER IF EXISTS trg_queue_media_analysis ON media;
CREATE TRIGGER trg_queue_media_analysis
  AFTER INSERT ON media
  FOR EACH ROW
  EXECUTE FUNCTION queue_media_for_analysis();