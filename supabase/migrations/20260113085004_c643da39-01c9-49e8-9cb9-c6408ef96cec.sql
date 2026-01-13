-- Enable realtime for command center tables
ALTER PUBLICATION supabase_realtime ADD TABLE power_network_analyses;
ALTER PUBLICATION supabase_realtime ADD TABLE behavioral_scenario_predictions;
ALTER PUBLICATION supabase_realtime ADD TABLE action_recommendations;
ALTER PUBLICATION supabase_realtime ADD TABLE behavioral_anomalies;
ALTER PUBLICATION supabase_realtime ADD TABLE deception_analyses;