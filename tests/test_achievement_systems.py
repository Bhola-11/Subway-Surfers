import unittest
from apps.achievements.badges.badge_catalog import BadgeDefinitionCatalog
from apps.achievements.badges.criteria_engine import BooleanCriteriaEvaluator
from apps.achievements.badges.tiered_badges import TieredProgressCalculator
from apps.achievements.badges.secret_triggers import EasterEggTriggerDetector

class TestAchievementSystems(unittest.TestCase):
    def test_badge_catalog(self):
        catalog = BadgeDefinitionCatalog()
        res = catalog.query_badge_metadata_1(1.0, 2.0)
        self.assertEqual(res["status"], "PROCESSED_OK")

    def test_criteria_engine(self):
        engine = BooleanCriteriaEvaluator()
        res = engine.eval_criteria_expression_1(0.5, 0.9)
        self.assertIn("calculated_value", res)

    def test_tiered_badges(self):
        tiered = TieredProgressCalculator()
        res = tiered.calc_tier_evolution_progress_1(2.0, 4.0)
        self.assertEqual(res["status"], "PROCESSED_OK")

    def test_secret_triggers(self):
        secret = EasterEggTriggerDetector()
        res = secret.detect_easter_egg_action_1(9.0, 9.0)
        self.assertEqual(res["status"], "PROCESSED_OK")

if __name__ == '__main__':
    unittest.main()
