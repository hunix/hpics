-- Remove problematic cron jobs that use current_setting('app.settings...')
-- These cannot work in Lovable Cloud environment

DO $$
BEGIN
  -- Attempt to unschedule each job, ignore errors if job doesn't exist
  BEGIN
    PERFORM cron.unschedule('daily-proactive-insights');
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Job daily-proactive-insights not found or already removed';
  END;
  
  BEGIN
    PERFORM cron.unschedule('weekly-lifecycle-analysis');
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Job weekly-lifecycle-analysis not found or already removed';
  END;
  
  BEGIN
    PERFORM cron.unschedule('hourly-anomaly-detection');
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Job hourly-anomaly-detection not found or already removed';
  END;
  
  BEGIN
    PERFORM cron.unschedule('biweekly-cross-contact-patterns');
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Job biweekly-cross-contact-patterns not found or already removed';
  END;
  
  BEGIN
    PERFORM cron.unschedule('nightly-relationship-scoring');
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Job nightly-relationship-scoring not found or already removed';
  END;
  
  BEGIN
    PERFORM cron.unschedule('nightly-opportunity-detection');
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Job nightly-opportunity-detection not found or already removed';
  END;
  
  BEGIN
    PERFORM cron.unschedule('nightly-methodology-analysis');
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Job nightly-methodology-analysis not found or already removed';
  END;
  
  BEGIN
    PERFORM cron.unschedule('weekly-network-intelligence');
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Job weekly-network-intelligence not found or already removed';
  END;
END $$;