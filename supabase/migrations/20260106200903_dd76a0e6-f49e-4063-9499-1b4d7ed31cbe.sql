-- Create function to log activity when communications are inserted
CREATE OR REPLACE FUNCTION public.log_communication_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.contact_activity_feed (
    user_id,
    profile_id,
    activity_type,
    activity_subtype,
    title,
    description,
    source,
    occurred_at,
    metadata,
    importance_score
  ) VALUES (
    NEW.user_id,
    NEW.profile_id,
    'communication',
    NEW.channel::text,
    CASE 
      WHEN NEW.direction = 'outgoing' THEN 'Outgoing ' || NEW.channel::text
      ELSE 'Incoming ' || NEW.channel::text
    END,
    COALESCE(NEW.subject, LEFT(NEW.content, 100)),
    NEW.channel::text,
    NEW.occurred_at,
    jsonb_build_object(
      'direction', NEW.direction,
      'duration_minutes', NEW.duration_minutes,
      'sentiment_score', NEW.sentiment_score
    ),
    CASE 
      WHEN NEW.sentiment_score IS NOT NULL AND NEW.sentiment_score < -0.5 THEN 8
      WHEN NEW.sentiment_score IS NOT NULL AND NEW.sentiment_score > 0.5 THEN 6
      ELSE 5
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to log activity when messages are inserted
CREATE OR REPLACE FUNCTION public.log_message_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_profile_id uuid;
  v_user_id uuid;
BEGIN
  -- Get profile_id and user_id from the conversation
  SELECT c.profile_id, c.user_id INTO v_profile_id, v_user_id
  FROM public.conversations c
  WHERE c.id = NEW.conversation_id;
  
  IF v_profile_id IS NOT NULL THEN
    INSERT INTO public.contact_activity_feed (
      user_id,
      profile_id,
      activity_type,
      activity_subtype,
      title,
      description,
      source,
      occurred_at,
      metadata,
      importance_score
    ) VALUES (
      v_user_id,
      v_profile_id,
      'message',
      CASE WHEN NEW.is_from_contact THEN 'received' ELSE 'sent' END,
      CASE WHEN NEW.is_from_contact THEN 'Message Received' ELSE 'Message Sent' END,
      LEFT(NEW.content, 150),
      COALESCE(NEW.source, 'chat'),
      COALESCE(NEW.sent_at, NOW()),
      jsonb_build_object(
        'message_type', NEW.message_type,
        'has_media', NEW.media_url IS NOT NULL
      ),
      3
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to log activity when media is uploaded
CREATE OR REPLACE FUNCTION public.log_media_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.contact_activity_feed (
    user_id,
    profile_id,
    activity_type,
    activity_subtype,
    title,
    description,
    source,
    occurred_at,
    metadata,
    importance_score
  ) VALUES (
    NEW.user_id,
    NEW.profile_id,
    'media_upload',
    NEW.media_type,
    'New ' || NEW.media_type || ' uploaded',
    NEW.title,
    'upload',
    NEW.created_at,
    jsonb_build_object(
      'file_size', NEW.file_size,
      'file_name', NEW.file_name,
      'has_ai_metadata', NEW.ai_metadata IS NOT NULL
    ),
    4
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to log activity when documents are uploaded
CREATE OR REPLACE FUNCTION public.log_document_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.contact_activity_feed (
    user_id,
    profile_id,
    activity_type,
    activity_subtype,
    title,
    description,
    source,
    occurred_at,
    metadata,
    importance_score
  ) VALUES (
    NEW.user_id,
    NEW.profile_id,
    'document_upload',
    NEW.document_type,
    'New document: ' || NEW.title,
    NEW.description,
    'upload',
    NEW.created_at,
    jsonb_build_object(
      'file_size', NEW.file_size,
      'document_type', NEW.document_type
    ),
    4
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to log activity when AI analyses are completed
CREATE OR REPLACE FUNCTION public.log_analysis_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.contact_activity_feed (
    user_id,
    profile_id,
    activity_type,
    activity_subtype,
    title,
    description,
    source,
    occurred_at,
    metadata,
    importance_score
  ) VALUES (
    NEW.user_id,
    NEW.profile_id,
    'analysis',
    NEW.analysis_type,
    'AI Analysis: ' || NEW.analysis_type,
    'AI analysis completed for this contact',
    'ai',
    NEW.generated_at,
    jsonb_build_object(
      'analysis_type', NEW.analysis_type
    ),
    6
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to log activity when relationships change
CREATE OR REPLACE FUNCTION public.log_relationship_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Log for the from_profile
  INSERT INTO public.contact_activity_feed (
    user_id,
    profile_id,
    activity_type,
    activity_subtype,
    title,
    description,
    source,
    occurred_at,
    metadata,
    importance_score
  ) VALUES (
    NEW.user_id,
    NEW.from_profile_id,
    'relationship',
    CASE WHEN TG_OP = 'INSERT' THEN 'created' ELSE 'updated' END,
    'Relationship ' || CASE WHEN TG_OP = 'INSERT' THEN 'added' ELSE 'updated' END,
    NEW.relationship_type || COALESCE(' - ' || NEW.subtype, ''),
    'system',
    NOW(),
    jsonb_build_object(
      'relationship_type', NEW.relationship_type,
      'subtype', NEW.subtype,
      'to_profile_id', NEW.to_profile_id
    ),
    5
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to log activity when events are created
CREATE OR REPLACE FUNCTION public.log_event_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.profile_id IS NOT NULL THEN
    INSERT INTO public.contact_activity_feed (
      user_id,
      profile_id,
      activity_type,
      activity_subtype,
      title,
      description,
      source,
      occurred_at,
      metadata,
      importance_score
    ) VALUES (
      NEW.user_id,
      NEW.profile_id,
      'event',
      NEW.event_type,
      'Event: ' || NEW.title,
      NEW.description,
      'calendar',
      COALESCE(NEW.event_date, NOW()),
      jsonb_build_object(
        'event_type', NEW.event_type,
        'is_recurring', NEW.is_recurring
      ),
      CASE 
        WHEN NEW.event_type IN ('birthday', 'anniversary') THEN 7
        ELSE 5
      END
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the triggers
CREATE TRIGGER trigger_log_communication_activity
  AFTER INSERT ON public.communications
  FOR EACH ROW
  EXECUTE FUNCTION public.log_communication_activity();

CREATE TRIGGER trigger_log_message_activity
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.log_message_activity();

CREATE TRIGGER trigger_log_media_activity
  AFTER INSERT ON public.media
  FOR EACH ROW
  EXECUTE FUNCTION public.log_media_activity();

CREATE TRIGGER trigger_log_document_activity
  AFTER INSERT ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.log_document_activity();

CREATE TRIGGER trigger_log_analysis_activity
  AFTER INSERT ON public.ai_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.log_analysis_activity();

CREATE TRIGGER trigger_log_relationship_activity
  AFTER INSERT OR UPDATE ON public.contact_relationships
  FOR EACH ROW
  EXECUTE FUNCTION public.log_relationship_activity();

CREATE TRIGGER trigger_log_event_activity
  AFTER INSERT ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.log_event_activity();