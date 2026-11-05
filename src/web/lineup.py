"""Data for the "Line-up" module on launch vehicle pages.

The module draws every rocket flying in the next 30 days to scale and lets the
reader open any of them in a 3D viewer (static/lineup/lineup.js, built from
frontend/lineup). This module only shapes the data; drawing happens client-side.
"""

import re
from datetime import timedelta

from api.models import Launch, LauncherConfig
from django.core.cache import cache
from django.utils import timezone

WINDOW_DAYS = 30
WINDOW_LABEL = f"Next {WINDOW_DAYS} days"
UPCOMING_CACHE_KEY = "web:lineup:upcoming_config_ids"
UPCOMING_CACHE_SECONDS = 600

# Vehicles that have a drawn silhouette (and maybe a detailed 3D model) in
# frontend/lineup/src/assets.js. First match on the configuration's full name wins,
# so more specific patterns come first. Anything else gets a generic outline.
ASSET_PATTERNS = [
    ("falconheavy", r"\bfalcon heavy\b"),
    ("falcon9", r"\bfalcon 9\b"),
    ("starship", r"\bstarship\b|\bsuper heavy\b"),
    ("sls", r"\bspace launch system\b|\bsls\b"),
    ("newglenn", r"\bnew glenn\b"),
    ("ariane6", r"\bariane 6"),
    ("vulcan", r"\bvulcan\b"),
    ("atlasv", r"\batlas v\b"),
    ("lm5b", r"\blong march 5b\b"),
    ("longmarch5", r"\blong march 5\b"),
    ("lm2c", r"\blong march 2c\b"),
    ("lm2d", r"\blong march 2d\b"),
    ("lm3b", r"\blong march 3b\b"),
    ("lm4c", r"\blong march 4c\b"),
    ("lm6a", r"\blong march 6a\b"),
    ("lm7a", r"\blong march 7a\b"),
    ("lm7", r"\blong march 7\b"),
    ("lm8", r"\blong march 8\b"),
    ("lm12", r"\blong march 12\b"),
    ("zhuque2e", r"\bzhuque[- ]2"),
    ("ceres1", r"\bceres[- ]1\b"),
    ("kinetica1", r"\bkinetica[- ]1\b|\blijian[- ]1\b"),
    ("gravity1", r"\bgravity[- ]1\b"),
    ("pslv", r"\bpslv\b"),
    ("lvm3", r"\blvm[- ]?3\b|\bgslv mk ?iii\b"),
    ("h3", r"\bh3\b"),
    ("angaraa5", r"\bangara a5"),
    ("fireflyalpha", r"\bfirefly alpha\b|^alpha\b"),
    ("neutron", r"^neutron\b"),
    ("soyuz", r"\bsoyuz[- ]2"),
    ("vegac", r"\bvega[- ]c\b"),
    ("kuaizhou", r"\bkuaizhou[- ]1a?\b"),
    ("electron", r"^electron\b"),
]
_ASSET_RES = [(key, re.compile(pattern, re.IGNORECASE)) for key, pattern in ASSET_PATTERNS]


def match_asset(*names):
    """Return the asset key for the first name that matches a known vehicle, else None."""
    for name in names:
        if not name:
            continue
        for key, regex in _ASSET_RES:
            if regex.search(name):
                return key
    return None


def _number(value):
    if value is None or value == "":
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    if number <= 0:
        return None
    return int(number) if number.is_integer() else round(number, 2)


def launcher_entry(config, in_window=True):
    """Serialisable record for one launcher configuration (keys match lineup.js)."""
    manufacturer = getattr(config, "manufacturer", None)
    full_name = getattr(config, "full_name", None)
    maiden = getattr(config, "maiden_flight", None)
    return {
        "id": config.id,
        "name": config.name,
        "provider": (manufacturer.abbrev or manufacturer.name) if manufacturer else "",
        "height": _number(getattr(config, "length", None)),
        "diameter": _number(getattr(config, "diameter", None)),
        "leo": _number(getattr(config, "leo_capacity", None)),
        "gto": _number(getattr(config, "gto_capacity", None)),
        "thrust": _number(getattr(config, "to_thrust", None)),
        "mass": _number(getattr(config, "launch_mass", None)),
        "stages": getattr(config, "max_stage", None),
        "firstFlight": maiden.year if maiden else None,
        "reusable": bool(getattr(config, "reusable", False)),
        "inWindow": in_window,
        "url": f"/vehicle/launch_vehicle/{config.id}/",
        "asset": match_asset(full_name, config.name),
    }


def _ordinal(n):
    if 10 <= n % 100 <= 20:
        return f"{n}th"
    return f"{n}{ {1: 'st', 2: 'nd', 3: 'rd'}.get(n % 10, 'th') }"


def line_up_title(featured, entries):
    """Headline for the module, e.g. "The joint 4th tallest of 13 rockets flying in the next 30 days." """
    when = WINDOW_LABEL.lower()
    if featured["height"] is None:
        return f"{featured['name']}'s height is not published, so it sits out the line-up."
    others = [e for e in entries if e["inWindow"] and e["height"] is not None and e["id"] != featured["id"]]
    if not others:
        if featured["inWindow"]:
            return f"The only rocket with a published height flying in the {when}."
        return f"No other rockets with a published height are flying in the {when}."
    taller = sum(1 for e in others if e["height"] > featured["height"])
    joint = any(e["height"] == featured["height"] for e in others)
    position = taller + 1
    which = "tallest" if position == 1 else f"{_ordinal(position)} tallest"
    if joint:
        which = f"joint {which}"
    total = len(others) + 1
    if featured["inWindow"]:
        return f"The {which} of {total} rockets flying in the {when}."
    return f"Not flying in the {when}, but it would be the {which} of {total} rockets."


def _upcoming_config_ids(now):
    def query():
        return sorted(
            set(
                Launch.objects.filter(net__gte=now, net__lt=now + timedelta(days=WINDOW_DAYS))
                .exclude(rocket__configuration__isnull=True)
                .values_list("rocket__configuration_id", flat=True)
            )
        )

    return cache.get_or_set(UPCOMING_CACHE_KEY, query, UPCOMING_CACHE_SECONDS)


def build_line_up(featured_config, entries, featured_in_window):
    """Assemble the module context from the featured vehicle and the other rockets in the window."""
    entries = [e for e in entries if e["id"] != featured_config.id]
    featured = launcher_entry(featured_config, in_window=featured_in_window)
    entries.append(featured)
    return {
        "featured": featured["id"],
        "title": line_up_title(featured, entries),
        "window_label": WINDOW_LABEL,
        "rockets": [e for e in entries if e["height"] is not None],
        "no_height": [e for e in entries if e["height"] is None],
        "stats": featured,
    }


def get_line_up(vehicle, now=None):
    """Line-up context for a launch vehicle page."""
    now = now or timezone.now()
    ids = _upcoming_config_ids(now)
    configs = LauncherConfig.objects.select_related("manufacturer").filter(id__in=ids).exclude(id=vehicle.id)
    return build_line_up(vehicle, [launcher_entry(c) for c in configs], featured_in_window=vehicle.id in ids)
