"""Unit test rumus (testing.md §2.1)."""

import pytest

from app.engine import circle as c


@pytest.mark.parametrize(
    ("fn", "args", "expected"),
    [
        (c.arc_length, (14, 90, "22/7"), 22),
        (c.sector_area, (14, 90, "22/7"), 154),
        (c.arc_length, (7, 90, "22/7"), 11),
        (c.sector_area, (7, 90, "22/7"), 38.5),
        (c.arc_length, (21, 60, "22/7"), 22),
        (c.sector_area, (21, 60, "22/7"), 231),
        (c.arc_length, (10, 36, "3.14"), 6.28),
        (c.sector_area, (10, 180, "3.14"), 157),
        (c.sector_area, (10, 72, "3.14"), 62.8),
        (c.arc_length, (7, 120, "22/7"), 14.67),
        (c.sector_perimeter, (14, 90, "22/7"), 50),
        (c.theta_from_arc, (22, 14, "22/7"), 90),
        (c.radius_from_area, (77, 45, "22/7"), 14),
        (c.radius_from_arc, (44, 120, "22/7"), 21),
    ],
)
def test_formula_table(fn, args, expected):
    assert c.round2(fn(*args)) == expected


@pytest.mark.parametrize(("r", "mode"), [(14, "22/7"), (7, "22/7"), (10, "3.14"), (10.5, "22/7"), (3.5, "22/7"), (5, "3.14")])
def test_pick_pi(r, mode):
    assert c.pick_pi(r) == mode


def test_pi_auto_when_mode_missing():
    assert c.round2(c.arc_length(14, 90)) == 22
    assert c.round2(c.sector_area(10, 180)) == 157


def test_boundaries():
    assert c.arc_length(7, 0) == 0
    assert c.round2(c.arc_length(7, 360)) == c.round2(c.circumference(7))
    assert c.round2(c.sector_area(7, 360)) == c.round2(c.circle_area(7))
    with pytest.raises(ValueError):
        c.arc_length(0, 90)
    with pytest.raises(ValueError):
        c.sector_area(7, 400)
    with pytest.raises(ValueError):
        c.radius_from_arc(10, 0)


@pytest.mark.parametrize(("theta", "label"), [(90, "1/4"), (60, "1/6"), (45, "1/8"), (120, "1/3"), (270, "3/4"), (360, "1"), (0, "0"), (100, "5/18")])
def test_fraction_label(theta, label):
    assert c.fraction_label(theta) == label


@pytest.mark.parametrize(("x", "expected"), [(14.666666, 14.67), (2.4444, 2.44), (6.280000000000001, 6.28), (0.125, 0.13), (14.665, 14.67), (57.75, 57.75)])
def test_round2_half_up(x, expected):
    assert c.round2(x) == expected
