import unittest
from apps.leaderboard.ranking.elo_rating import EloScoreCalculator
from apps.leaderboard.ranking.tier_engine import TierDivisionMapper
from apps.leaderboard.ranking.tournament_system import TournamentScheduleEngine
from apps.leaderboard.ranking.ghost_runs import GhostTrajectoryRecorder
from apps.leaderboard.ranking.score_verifier import DistanceScoreRatioValidator

class TestRankingSystems(unittest.TestCase):
    def test_elo_calculator(self):
        elo = EloScoreCalculator()
        res = elo.calc_elo_delta_1(1200.0, 1350.0)
        self.assertEqual(res["status"], "PROCESSED_OK")

    def test_tier_division(self):
        tier = TierDivisionMapper()
        res = tier.map_score_to_division_1(5000.0, 10000.0)
        self.assertIn("calculated_value", res)

    def test_tournament(self):
        tourney = TournamentScheduleEngine()
        res = tourney.eval_tournament_window_1(1.0, 2.0)
        self.assertEqual(res["status"], "PROCESSED_OK")

    def test_ghost_runs(self):
        ghost = GhostTrajectoryRecorder()
        res = ghost.record_ghost_keyframes_1(10.0, 20.0)
        self.assertEqual(res["status"], "PROCESSED_OK")

    def test_score_verifier(self):
        verifier = DistanceScoreRatioValidator()
        res = verifier.validate_score_plausibility_1(500.0, 2500.0)
        self.assertEqual(res["status"], "PROCESSED_OK")

if __name__ == '__main__':
    unittest.main()
