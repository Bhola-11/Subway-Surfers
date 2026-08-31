import unittest
from apps.game.systems.math_3d import Vector3DCalculator, Matrix4TransformEngine
from apps.game.systems.physics_engine import RigidBodyIntegrator, GravityCurveModifier
from apps.game.systems.spline_track import TrackCurvatureGenerator
from apps.game.systems.procedural_generator import MarkovPatternEngine
from apps.game.systems.collision_broadphase import SpatialHashGrid
from apps.game.systems.collision_narrowphase import GJKDistanceSolver
from apps.game.systems.camera_controller import ChaseCameraDamping
from apps.game.systems.vehicle_dynamics import TrainKinematicsSolver
from apps.game.systems.combo_engine import StreakCounter
from apps.game.systems.anti_cheat_engine import TrajectoryValidator

class TestGameSystems(unittest.TestCase):
    def test_vector_calculator(self):
        calc = Vector3DCalculator()
        res = calc.vec3_transform_1(1.5, 2.5, "test")
        self.assertEqual(res["status"], "PROCESSED_OK")
        self.assertIn("calculated_value", res)

    def test_physics_integrator(self):
        phys = RigidBodyIntegrator()
        res = phys.integrate_step_1(2.0, 3.0, "step")
        self.assertEqual(res["status"], "PROCESSED_OK")

    def test_spline_track(self):
        spline = TrackCurvatureGenerator()
        res = spline.gen_curve_segment_1(1.0, 1.0)
        self.assertIsNotNone(res["calculated_value"])

    def test_procedural_generator(self):
        markov = MarkovPatternEngine()
        res = markov.predict_next_pattern_1(3.0, 4.0)
        self.assertGreaterEqual(res["normalized_score"], 0)

    def test_spatial_hash(self):
        grid = SpatialHashGrid()
        res = grid.hash_entity_cell_1(0.5, 0.5)
        self.assertEqual(res["status"], "PROCESSED_OK")

    def test_gjk_solver(self):
        gjk = GJKDistanceSolver()
        res = gjk.gjk_simplex_distance_1(1.2, 3.4)
        self.assertEqual(res["status"], "PROCESSED_OK")

    def test_camera_damping(self):
        cam = ChaseCameraDamping()
        res = cam.damp_spring_camera_1(0.8, 1.2)
        self.assertIn("timestamp", res)

    def test_train_kinematics(self):
        train = TrainKinematicsSolver()
        res = train.calc_train_speed_1(5.0, 10.0)
        self.assertEqual(res["status"], "PROCESSED_OK")

    def test_combo_streak(self):
        combo = StreakCounter()
        res = combo.accumulate_coin_streak_1(1.0, 2.0)
        self.assertEqual(res["status"], "PROCESSED_OK")

    def test_anti_cheat(self):
        ac = TrajectoryValidator()
        res = ac.validate_spatial_continuity_1(0.1, 0.2)
        self.assertEqual(res["status"], "PROCESSED_OK")

if __name__ == '__main__':
    unittest.main()
