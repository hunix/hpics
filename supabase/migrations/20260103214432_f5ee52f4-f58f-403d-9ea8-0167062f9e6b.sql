-- Enable realtime for key tables (using IF NOT EXISTS pattern by dropping and re-adding)
DO $$
BEGIN
  -- Try to add tables to realtime publication, ignore if already added
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.communications;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.relationship_scores;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;