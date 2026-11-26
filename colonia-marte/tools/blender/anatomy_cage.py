"""C4 retopology of the supplied, inspected Blender FBX cage."""
from collections import defaultdict
from math import copysign

from mathutils import Vector


ARM_ROOT = [115, 146, 148, 150, 149, 147]
ELBOW_UPPER = [153, 151, 152, 211, 210, 207]
ELBOW_LOWER = [159, 155, 157, 158, 156, 154]
ELBOW_CROSSINGS = [(159, 153), (155, 151), (157, 152), (158, 211), (156, 209), (154, 208)]
KNEE = [[172, 174, 173, 176, 177, 175], [178, 180, 179, 182, 183, 181],
        [184, 186, 185, 188, 189, 187]]
SOURCE_HEIGHT = [(0, 0), (.275, .125), (.856, .352), (1.033, .410), (1.12, .452),
                 (1.317, .510), (1.951, .810), (2.269, .940), (2.562, 1.010),
                 (2.877, 1.099), (3.189, 1.235), (3.499, 1.327), (3.597, 1.364),
                 (3.721, 1.472), (4.221, 1.750)]
LEG_AXIS = [(0, .682, .139), (.275, .625, .138), (.856, .504, .129),
            (1.12, .439, .116), (1.317, .375, .110), (1.951, .240, .103)]
ARM_TRAVEL = [(-.16, -.065), (0, 0), (.65, .243), (1.295, .449), (1.69, .558), (1.78, .591)]
ARM_DEPTH = [(-.2, .11), (.65, .105), (1.29, -.015), (1.78, -.085)]
EYE_LOW = {470, 217}
EYE_HIGH = {449, 198}
DELTOID = (137, 141, 142, 143, 144, 145)


def blend(a, b, weight):
    return a * (1 - weight) + b * weight


def ramp(value, low, high):
    return max(0.0, min(1.0, (value - low) / (high - low)))


def curve(value, stations):
    for (left, a), (right, b) in zip(stations, stations[1:]):
        if value <= right:
            return blend(a, b, ramp(value, left, right))
    return stations[-1][1]


def reflect_index(vertices):
    by_position = {tuple(round(component, 5) for component in point): i
                   for i, point in enumerate(vertices)}
    return [by_position[tuple(round(component, 5) for component in (-point.x, point.y, point.z))]
            for point in vertices]


def reach_arm(faces):
    """The ring forms the shoulder boundary; stop traversal at that boundary."""
    neighbors = defaultdict(set)
    for face in faces:
        for a, b in zip(face, face[1:] + face[:1]):
            neighbors[a].add(b)
            neighbors[b].add(a)
    result, pending = set(ARM_ROOT), [152]
    while pending:
        index = pending.pop()
        if index not in result:
            result.add(index)
            pending.extend(neighbors[index] - result)
    if not 80 < len(result) < 140:
        raise ValueError(f"Unexpected source arm partition: {len(result)}")
    return result


def arm_space(point):
    x, y, z = point
    x, z = abs(x) - .45, z - 3.39
    travel = .577 * x - .817 * z
    transverse = .817 * x + .577 * z
    return travel, transverse, y - curve(travel, ARM_DEPTH)


def shape_arm(point):
    travel, transverse, depth = arm_space(point)
    length = curve(travel, ARM_TRAVEL)
    width = curve(travel, [(-.2, .36), (.64, .385), (1.20, .36), (1.40, .43), (1.78, .39)])
    return Vector((.168 + .711 * length + .703 * transverse * width,
                   .028 + depth * .43 - .035 * ramp(travel, .5, 1.4),
                   1.304 - .703 * length + .711 * transverse * width))


def shape_trunk(point):
    x, y, z = point
    width = curve(z, [(1.8, .425), (2.28, .434), (2.88, .468), (3.22, .372),
                      (3.50, .355), (3.60, .385)])
    depth = curve(z, [(1.8, .39), (2.28, .429), (2.88, .371), (3.32, .419), (3.59, .405)])
    offset = (y - .045) * depth
    if y < -.06:
        offset -= .012 * ramp(z, 2.94, 3.21) * (1 - ramp(z, 3.30, 3.50))
    return Vector((abs(x) * width, offset, curve(z, SOURCE_HEIGHT)))


def shape_leg(point, trunk):
    x, y, z = point
    source_center = curve(z, [(a, b) for a, b, _ in LEG_AXIS])
    target_center = curve(z, [(a, c) for a, _, c in LEG_AXIS])
    width = curve(z, [(0, .44), (.4, .42), (.85, .45), (1.13, .435), (1.95, .429)])
    back = (y - .137 * (1 - ramp(z, .65, 1.85))) * .365
    boot_top = .012 * ramp(z, .74, .91) * (1 - ramp(z, 1.03, 1.17))
    foot = Vector((target_center + (abs(x) - source_center) * (width + boot_top),
                   back, curve(z, SOURCE_HEIGHT)))
    if z < .009:
        foot.z = 0
    return foot.lerp(trunk, ramp(z, 1.84, 2.13))


def shape_head(point, index, trunk):
    x, y, z = point
    width = curve(z, [(3.59, .39), (3.70, .48), (3.83, .67), (3.98, .76), (4.22, .73)])
    forward = y < -.105
    depth = y * .47 - .004
    if forward:
        depth = blend(depth, -.124, ramp(-y, .105, .185) * .98)
    height = curve(z, [(3.60, 1.369), (3.641, 1.405), (3.721, 1.453),
                       (3.816, 1.515), (3.95, 1.622), (4.22, 1.745)])
    if index in EYE_LOW:
        height, depth = 1.584, depth + .003
    if index in EYE_HIGH:
        height, depth = 1.617, depth + .003
    head = Vector((abs(x) * width, depth, height))
    if index in (124, 127, 216):
        head.x += .023
    if index == 369:
        head.z += .012
    if index in (222, 223):
        head.x -= .032
        head.z -= .011
    return trunk.lerp(head, ramp(z, 3.58, 3.68))


def shape_cage(vertices, arms, opposite):
    points = []
    for index, point in enumerate(vertices):
        x, _, z = point
        lookup = index if x >= 0 else opposite[index]
        trunk = shape_trunk(point)
        if index in arms:
            shaped = shape_arm(point)
            shaped = trunk.lerp(shaped, .70) if lookup in ARM_ROOT else shaped
        elif lookup in DELTOID:
            shaped = trunk.lerp(shape_arm(point), .18)
        elif z < 2.13:
            shaped = shape_leg(point, trunk)
        elif z >= 3.58:
            shaped = shape_head(point, lookup, trunk)
        else:
            shaped = trunk
        shaped.x = copysign(shaped.x, x) if abs(x) > 1e-6 else 0
        points.append(shaped)
    # Reflect the original paired points before splitting, avoiding FBX float jitter.
    for i, other in enumerate(opposite):
        if i < other:
            paired = points[i].lerp(Vector((-points[other].x, points[other].y, points[other].z)), .5)
            points[i] = paired
            points[other] = Vector((-paired.x, paired.y, paired.z))
    return points


def zone(face, source, arm_ids):
    x, y, z = sum((source[i] for i in face), Vector()) / len(face)
    arm = any(i in arm_ids for i in face)
    if z > 3.655:
        return "skin"
    if arm and arm_space((x, y, z))[0] > 1.32:
        return "skin"
    if arm and arm_space((x, y, z))[0] > 1.015:
        return "red"
    if not arm and z < 1.036:
        return "black"
    if not arm and z < 1.165:
        return "red"
    if z > 3.385 or (abs(x) > .325 and z > 3.19):
        return "red"
    if not arm and 2.28 < z < 2.72 and abs(x) > .20 and y < .085:
        return "red"
    return "crewCharcoal"


class CageSplit:
    """One conforming split preserves every guide edge and removes all n-gons."""

    def __init__(self, points, arm_support):
        self.points = points
        self.arm_support = arm_support
        self.faces = []
        self.zones = []
        self.midpoints = {}

    def add_point(self, point, support=0):
        self.points.append(point)
        self.arm_support.append(support)
        return len(self.points) - 1

    def edge(self, a, b):
        edge = tuple(sorted((a, b)))
        if edge not in self.midpoints:
            self.midpoints[edge] = self.add_point(self.points[a].lerp(self.points[b], .5),
                                                  (self.arm_support[a] + self.arm_support[b]) / 2)
        return self.midpoints[edge]

    def quad(self, vertices, color):
        self.faces.append(tuple(vertices))
        self.zones.append(color)

    def face(self, face, color):
        center = self.add_point(sum((self.points[i] for i in face), Vector()) / len(face),
                                sum(self.arm_support[i] for i in face) / len(face))
        for i, a in enumerate(face):
            self.quad((a, self.edge(a, face[(i + 1) % len(face)]), center, self.edge(a, face[i - 1])), color)

    def eye(self, face, opposite):
        # Work in semantic order on both halves; keep the inlay on the same closed surface.
        outer = [470, 217, 198, 449]
        if 217 not in face:
            outer = [opposite[i] for i in outer]
        a, b, c, d = [self.points[i] for i in outer]
        inner = []
        for u, v in ((.43, .15), (.98, .15), (.98, .85), (.43, .85)):
            point = a.lerp(b, u).lerp(d.lerp(c, u), v)
            point.y += .002
            inner.append(self.add_point(point))
        for i in range(4):
            j = (i + 1) % 4
            self.face([outer[i], outer[j], inner[j], inner[i]], "skin")
        self.face(inner, "black")

    def ring(self, indices):
        return [value for i, a in enumerate(indices)
                for value in (a, self.edge(a, indices[(i + 1) % len(indices)]))]

    def elbow_middle(self, crossings):
        # The six cross-edges pass through the strip between the two original guide rings.
        mid = [self.midpoints[tuple(sorted(edge))] for edge in crossings]
        by_point = defaultdict(set)
        for face in self.faces:
            for a, b in zip(face, face[1:] + face[:1]):
                by_point[a].add(b)
                by_point[b].add(a)
        ring = []
        for i, a in enumerate(mid):
            b = mid[(i + 1) % len(mid)]
            candidates = by_point[a] & by_point[b]
            if len(candidates) != 1:
                raise ValueError(f"Cannot recover the elbow support strip: {candidates}")
            ring.extend((a, candidates.pop()))
        return ring


def retopologize(vertices, faces):
    if len(vertices) != 484 or len(faces) != 508 or set(faces[172]) != {470, 217, 198, 449}:
        raise ValueError("Unexpected FBX revision; inspect its landmarks and the edge rings before rebuilding.")
    opposite = reflect_index(vertices)
    positive = reach_arm(faces)
    arms = positive | {opposite[i] for i in positive}
    roots = set(ARM_ROOT) | {opposite[i] for i in ARM_ROOT}
    deltoids = set(DELTOID) | {opposite[i] for i in DELTOID}
    support = [.63 if i in roots else 1 if i in arms else .35 if i in deltoids else 0
               for i in range(len(vertices))]
    split = CageSplit(shape_cage(vertices, arms, opposite), support)
    eyes = {frozenset(faces[172]), frozenset(opposite[i] for i in faces[172])}
    for face in faces:
        if frozenset(face) in eyes:
            split.eye(face, opposite)
        else:
            split.face(face, zone(face, vertices, arms))
    loops = {}
    for side in ("L", "R"):
        def map_ring(ring):
            return [i if side == "L" else opposite[i] for i in ring]
        loops[f"elbow.{side}"] = [split.ring(map_ring(ELBOW_UPPER)),
                                  split.elbow_middle([map_ring(edge) for edge in ELBOW_CROSSINGS]),
                                  split.ring(map_ring(ELBOW_LOWER))]
        loops[f"knee.{side}"] = [split.ring(map_ring(ring)) for ring in KNEE]
    return split, loops
