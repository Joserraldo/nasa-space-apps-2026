import { Path, Shape } from "three";

export function polygonShape(radius: number, sides: number, rotation = Math.PI / sides): Shape {
  if (!(radius > 0) || !Number.isInteger(sides) || sides < 3) throw new Error("Invalid polygon");
  const shape = new Shape();
  for (let i = 0; i < sides; i++) {
    const angle = rotation + i / sides * Math.PI * 2;
    const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius;
    if (!i) shape.moveTo(x, y); else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

export function polygonRing(outer: number, inner: number, sides: number): Shape {
  if (!(inner > 0 && inner < outer)) throw new Error("Invalid ring radii");
  const shape = polygonShape(outer, sides);
  shape.holes.push(new Path(polygonShape(inner, sides).getPoints().reverse()));
  return shape;
}

export function chamferRect(width: number, height: number, chamfer: number): Shape {
  if (!(width > 0 && height > 0 && chamfer > 0 && chamfer < Math.min(width, height) / 2)) {
    throw new Error("Invalid chamfer rectangle");
  }
  const x = width / 2, y = height / 2, c = chamfer;
  const points = [[-x+c,-y],[x-c,-y],[x,-y+c],[x,y-c],[x-c,y],[-x+c,y],[-x,y-c],[-x,-y+c]];
  const shape = new Shape();
  points.forEach(([px, py], i) => i ? shape.lineTo(px, py) : shape.moveTo(px, py));
  shape.closePath();
  return shape;
}
