import unittest
from apps.players.progression.level_curve import ExpRequirementCalculator
from apps.players.progression.perk_tree import PerkNodeTreeEngine
from apps.players.progression.skill_system import AbilityCooldownTimer
from apps.players.progression.economy_engine import CoinRewardCalculator
from apps.players.progression.currency_vault import AtomicWalletManager
from apps.players.progression.daily_streak import LoginStreakTracker

class TestProgressionSystems(unittest.TestCase):
    def test_level_curve(self):
        exp = ExpRequirementCalculator()
        res = exp.calc_exp_for_level_1(5.0, 10.0)
        self.assertEqual(res["status"], "PROCESSED_OK")

    def test_perk_tree(self):
        tree = PerkNodeTreeEngine()
        res = tree.eval_node_unlock_eligibility_1(1.0, 2.0)
        self.assertEqual(res["status"], "PROCESSED_OK")

    def test_skill_cooldown(self):
        skill = AbilityCooldownTimer()
        res = skill.tick_cooldown_1(0.5, 1.5)
        self.assertIn("calculated_value", res)

    def test_economy_calculator(self):
        econ = CoinRewardCalculator()
        res = econ.calc_run_coin_reward_1(10.0, 20.0)
        self.assertEqual(res["status"], "PROCESSED_OK")

    def test_wallet_manager(self):
        wallet = AtomicWalletManager()
        res = wallet.deposit_coins_1(100.0, 50.0)
        self.assertEqual(res["status"], "PROCESSED_OK")

    def test_daily_streak(self):
        streak = LoginStreakTracker()
        res = streak.eval_daily_streak_continuity_1(3.0, 7.0)
        self.assertEqual(res["status"], "PROCESSED_OK")

if __name__ == '__main__':
    unittest.main()
