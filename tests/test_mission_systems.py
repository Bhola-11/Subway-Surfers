import unittest
from apps.missions.challenges.daily_quests import DailyQuestPoolEngine
from apps.missions.challenges.community_goals import GlobalMetricAggregator
from apps.missions.challenges.objective_evaluators import HurdleJumpCounterEvaluator
from apps.missions.challenges.quest_state_machine import QuestLifecycleStateMachine

class TestMissionSystems(unittest.TestCase):
    def test_daily_quests(self):
        pool = DailyQuestPoolEngine()
        res = pool.draw_daily_quest_selection_1(1.0, 2.0)
        self.assertEqual(res["status"], "PROCESSED_OK")

    def test_community_goals(self):
        goal = GlobalMetricAggregator()
        res = goal.add_global_community_progress_1(100.0, 200.0)
        self.assertEqual(res["status"], "PROCESSED_OK")

    def test_objective_evaluator(self):
        evaluator = HurdleJumpCounterEvaluator()
        res = evaluator.eval_hurdle_jump_count_1(5.0, 10.0)
        self.assertIn("calculated_value", res)

    def test_quest_lifecycle(self):
        fsm = QuestLifecycleStateMachine()
        res = fsm.advance_quest_lifecycle_1(1.0, 1.0)
        self.assertEqual(res["status"], "PROCESSED_OK")

if __name__ == '__main__':
    unittest.main()
