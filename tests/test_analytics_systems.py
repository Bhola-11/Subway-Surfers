import unittest
from apps.analytics.telemetry.telemetry_stream import TelemetryEventIngestionEngine
from apps.analytics.telemetry.heatmap_analyzer import SpatialCrashCoordinateAggregator
from apps.analytics.telemetry.dropoff_detector import SessionDurationAnalyzer
from apps.analytics.telemetry.performance_metrics import FrameRateTelemetryProcessor

class TestAnalyticsSystems(unittest.TestCase):
    def test_telemetry_stream(self):
        stream = TelemetryEventIngestionEngine()
        res = stream.ingest_telemetry_batch_1(1.0, 2.0)
        self.assertEqual(res["status"], "PROCESSED_OK")

    def test_heatmap_analyzer(self):
        heatmap = SpatialCrashCoordinateAggregator()
        res = heatmap.aggregate_crash_coords_1(10.0, 20.0)
        self.assertEqual(res["status"], "PROCESSED_OK")

    def test_dropoff_detector(self):
        dropoff = SessionDurationAnalyzer()
        res = dropoff.analyze_session_duration_1(300.0, 600.0)
        self.assertIn("calculated_value", res)

    def test_performance_metrics(self):
        perf = FrameRateTelemetryProcessor()
        res = perf.process_fps_readings_1(60.0, 59.0)
        self.assertEqual(res["status"], "PROCESSED_OK")

if __name__ == '__main__':
    unittest.main()
