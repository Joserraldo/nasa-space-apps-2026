export type Vec3 = [number, number, number];
export type Easing = "linear" | "smoothstep";
export interface Shot {
  id: string;
  position: Vec3[];
  target: Vec3[];
  fov: number;
  duration: number;
  easing: Easing;
  environment: string;
  zone: string;
  dof?: { focusDistance: number; focalLength: number; bokehScale: number };
  transition: { type: "cut" } | { type: "fade"; duration: number };
}
export interface ShotSequence { version: 1; id: string; shots: Shot[] }

function object(value: unknown, keys: string[], path: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${path}: expected object`);
  const record = value as Record<string, unknown>;
  if (Object.keys(record).some(key => !keys.includes(key))) throw new Error(`${path}: unknown field`);
  return record;
}
function text(value: unknown, path: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${path}: expected nonempty string`);
  return value;
}
function number(value: unknown, min: number, max: number, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) throw new Error(`${path}: invalid number`);
  return value;
}
function points(value: unknown, path: string, moving: boolean): Vec3[] {
  if (!Array.isArray(value) || value.length < 2 || value.length > 256) throw new Error(`${path}: expected 2..256 points`);
  const result = value.map((p,i) => {
    if (!Array.isArray(p) || p.length !== 3) throw new Error(`${path}[${i}]: expected vector`);
    return p.map(n => number(n,-100000,100000,path)) as Vec3;
  });
  if (moving && result.some((p,i) => i && Math.hypot(...p.map((n,j) => n-result[i-1][j]))<1e-5)) {
    throw new Error(`${path}: consecutive position points must differ`);
  }
  return result;
}

export function parseShot(input: unknown): Shot {
  const p = object(input,["id","position","target","fov","duration","easing","environment","zone","dof","transition"],"shot");
  const duration = number(p.duration,0.01,3600,"duration");
  if (p.easing !== "linear" && p.easing !== "smoothstep") throw new Error("easing: unsupported easing");
  const environment = text(p.environment,"environment");
  if (!/^AMB-0[1-8]$/.test(environment)) throw new Error("environment: unknown preset");
  const transition = object(p.transition,["type","duration"],"transition");
  let parsedTransition: Shot["transition"];
  if (transition.type === "cut" && transition.duration === undefined) parsedTransition = {type:"cut"};
  else if (transition.type === "fade") parsedTransition = {
    type:"fade", duration:number(transition.duration,0.001,duration/2,"transition.duration"),
  };
  else throw new Error("transition: expected cut or fade");
  const shot: Shot = {
    id:text(p.id,"id"), position:points(p.position,"position",true), target:points(p.target,"target",false),
    fov:number(p.fov,15,110,"fov"), duration, easing:p.easing,
    environment, zone:text(p.zone,"zone"), transition:parsedTransition,
  };
  if (p.dof !== undefined) {
    const dof = object(p.dof,["focusDistance","focalLength","bokehScale"],"dof");
    shot.dof = {
      focusDistance:number(dof.focusDistance,0.001,100000,"focusDistance"),
      focalLength:number(dof.focalLength,0.001,1,"focalLength"),
      bokehScale:number(dof.bokehScale,0,10,"bokehScale"),
    };
  }
  return shot;
}

export function parseSequence(input: unknown): ShotSequence {
  const p = object(input,["version","id","shots"],"sequence");
  if (p.version !== 1) throw new Error("sequence: unsupported version");
  if (!Array.isArray(p.shots) || !p.shots.length) throw new Error("sequence: no shots");
  const shots = p.shots.map(parseShot);
  if (new Set(shots.map(shot => shot.id)).size !== shots.length) throw new Error("sequence: duplicate shot id");
  for (let i=1; i<shots.length; i++) {
    const transition=shots[i].transition;
    if (transition.type === "fade" && transition.duration > shots[i-1].duration/2) {
      throw new Error("sequence: incoming fade exceeds half the previous shot duration");
    }
  }
  return {version:1,id:text(p.id,"sequence.id"),shots};
}
