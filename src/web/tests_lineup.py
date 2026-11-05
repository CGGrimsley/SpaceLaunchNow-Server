"""Tests for the launch vehicle page line-up module (web/lineup.py)."""

from datetime import date

from django.test import SimpleTestCase

from web.lineup import build_line_up, launcher_entry, line_up_title, match_asset


class _Agency:
    def __init__(self, name="Space Exploration Technologies Corp.", abbrev="SpX"):
        self.name = name
        self.abbrev = abbrev


class _Config:
    """Stand-in for a LauncherConfig row; only the attributes the module reads."""

    def __init__(self, id, name, length=None, full_name=None, **kwargs):
        self.id = id
        self.name = name
        self.full_name = full_name or name
        self.length = length
        self.diameter = kwargs.get("diameter")
        self.leo_capacity = kwargs.get("leo_capacity")
        self.gto_capacity = kwargs.get("gto_capacity")
        self.to_thrust = kwargs.get("to_thrust")
        self.launch_mass = kwargs.get("launch_mass")
        self.max_stage = kwargs.get("max_stage")
        self.maiden_flight = kwargs.get("maiden_flight")
        self.reusable = kwargs.get("reusable", False)
        self.manufacturer = kwargs.get("manufacturer", _Agency())


def _entry(id, name, height, in_window=True):
    return launcher_entry(_Config(id, name, length=height), in_window=in_window)


class MatchAssetTests(SimpleTestCase):
    def test_known_vehicles_match_their_silhouette(self):
        cases = {
            "Falcon 9 Block 5": "falcon9",
            "Falcon Heavy": "falconheavy",
            "Starship": "starship",
            "Space Launch System (SLS) Block 1": "sls",
            "New Glenn": "newglenn",
            "Ariane 64": "ariane6",
            "Ariane 6": "ariane6",
            "Vulcan VC6S": "vulcan",
            "Atlas V 551": "atlasv",
            "Long March 5": "longmarch5",
            "Soyuz-2.1b/Fregat-M": "soyuz",
            "Vega-C": "vegac",
            "Kuaizhou-1A": "kuaizhou",
            "Electron": "electron",
        }
        for name, key in cases.items():
            with self.subTest(name=name):
                self.assertEqual(match_asset(name), key)

    def test_falcon_heavy_is_not_mistaken_for_falcon_9(self):
        self.assertEqual(match_asset("Falcon Heavy"), "falconheavy")

    def test_unknown_vehicle_has_no_asset(self):
        self.assertIsNone(match_asset("Zhuque-2", None, ""))

    def test_falls_back_to_short_name(self):
        self.assertEqual(match_asset(None, "Electron"), "electron")


class LauncherEntryTests(SimpleTestCase):
    def test_serialises_published_figures(self):
        entry = launcher_entry(
            _Config(
                164,
                "Falcon 9",
                full_name="Falcon 9 Block 5",
                length=70.0,
                diameter=3.65,
                leo_capacity=22800,
                gto_capacity=8300,
                to_thrust=7607,
                launch_mass=549,
                max_stage=2,
                maiden_flight=date(2018, 5, 11),
                reusable=True,
            )
        )
        self.assertEqual(entry["height"], 70)
        self.assertEqual(entry["diameter"], 3.65)
        self.assertEqual(entry["leo"], 22800)
        self.assertEqual(entry["firstFlight"], 2018)
        self.assertEqual(entry["provider"], "SpX")
        self.assertEqual(entry["asset"], "falcon9")
        self.assertEqual(entry["url"], "/vehicle/launch_vehicle/164/")
        self.assertTrue(entry["reusable"])

    def test_missing_or_zero_figures_are_not_published(self):
        entry = launcher_entry(_Config(1, "Mystery", length=0, leo_capacity="", manufacturer=None))
        self.assertIsNone(entry["height"])
        self.assertIsNone(entry["leo"])
        self.assertIsNone(entry["firstFlight"])
        self.assertEqual(entry["provider"], "")


class LineUpTitleTests(SimpleTestCase):
    def test_joint_rank_among_rockets_in_window(self):
        featured = _entry(1, "Falcon 9", 70)
        others = [_entry(2, "Starship", 121), _entry(3, "SLS", 98), _entry(4, "New Glenn", 98)]
        others += [_entry(5, "Falcon Heavy", 70), _entry(6, "Electron", 18)]
        title = line_up_title(featured, [featured, *others])
        self.assertEqual(title, "The joint 4th tallest of 6 rockets flying in the next 30 days.")

    def test_tallest(self):
        featured = _entry(2, "Starship", 121)
        self.assertEqual(
            line_up_title(featured, [featured, _entry(1, "Falcon 9", 70)]),
            "The tallest of 2 rockets flying in the next 30 days.",
        )

    def test_ordinals(self):
        featured = _entry(99, "Small", 1)
        others = [_entry(i, f"R{i}", 100 - i) for i in range(1, 22)]
        self.assertTrue(line_up_title(featured, [featured, *others]).startswith("The 22nd tallest of 22"))
        others = others[:10]
        self.assertTrue(line_up_title(featured, [featured, *others]).startswith("The 11th tallest of 11"))

    def test_rockets_without_height_or_outside_window_are_not_counted(self):
        featured = _entry(1, "Falcon 9", 70)
        entries = [featured, _entry(2, "Mir", None), _entry(3, "Starship", 121, in_window=False)]
        title = line_up_title(featured, entries)
        self.assertEqual(title, "The only rocket with a published height flying in the next 30 days.")

    def test_featured_not_flying(self):
        featured = _entry(1, "Saturn V", 110.6, in_window=False)
        entries = [featured, _entry(2, "Starship", 121), _entry(3, "Falcon 9", 70)]
        title = line_up_title(featured, entries)
        self.assertEqual(title, "Not flying in the next 30 days, but it would be the 2nd tallest of 3 rockets.")

    def test_featured_without_height(self):
        featured = _entry(1, "Mir", None)
        title = line_up_title(featured, [featured])
        self.assertEqual(title, "Mir's height is not published, so it sits out the line-up.")


class BuildLineUpTests(SimpleTestCase):
    def test_splits_rockets_with_and_without_height(self):
        vehicle = _Config(1, "Falcon 9", length=70)
        entries = [_entry(2, "Starship", 121), _entry(3, "Ceres-2", None), _entry(1, "Falcon 9", 70)]
        line_up = build_line_up(vehicle, entries, featured_in_window=True)
        self.assertEqual(line_up["featured"], 1)
        self.assertEqual(sorted(r["id"] for r in line_up["rockets"]), [1, 2])
        self.assertEqual([r["id"] for r in line_up["no_height"]], [3])
        self.assertEqual(line_up["stats"]["name"], "Falcon 9")
        self.assertEqual(line_up["title"], "The 2nd tallest of 2 rockets flying in the next 30 days.")

    def test_featured_vehicle_is_always_included(self):
        vehicle = _Config(7, "Saturn V", length=110.6)
        line_up = build_line_up(vehicle, [_entry(2, "Starship", 121)], featured_in_window=False)
        featured = next(r for r in line_up["rockets"] if r["id"] == 7)
        self.assertFalse(featured["inWindow"])
