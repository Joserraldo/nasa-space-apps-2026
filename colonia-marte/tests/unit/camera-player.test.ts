import { describe, expect, it } from "vitest";
import { PerspectiveCamera } from "three";
import demo from "../../data/shots/ws0-demo.json";
import { parseShot } from "../../src/camera/schema";
import { SequencePlayer } from "../../src/camera/player";
import { ShotTrajectory } from "../../src/camera/trajectory";

describe("arc-length player T7.2", () => {
  it("maintains constant speed through unevenly spaced curved knots", () => {
    const path=new ShotTrajectory(parseShot({...demo.shots[0],position:[[0,1,0],[0.2,1,0.1],[3,2,2],[9,1,1],[10,1,4]]}));
    const dt=0.005, speeds:number[]=[];
    for (let t=dt; t<=path.shot.duration; t+=dt) {
      speeds.push(path.sample(t).position.distanceTo(path.sample(t-dt).position)/dt);
    }
    const expected=path.position.getLength()/path.shot.duration;
    expect(Math.max(...speeds)/expected).toBeLessThan(1.01);
    expect(Math.min(...speeds)/expected).toBeGreaterThan(0.99);
    expect(Math.max(...speeds.slice(1).map((v,i) => Math.abs(v-speeds[i])))/expected).toBeLessThan(0.01);
  });
  it("smoothstep eases with continuous speed and zero endpoint velocity", () => {
    const path=new ShotTrajectory(parseShot({...demo.shots[0],easing:"smoothstep"}));
    const speed=(t:number) => path.sample(t+0.001).position.distanceTo(path.sample(t).position)/0.001;
    expect(speed(0)).toBeLessThan(0.001);
    expect(speed(path.shot.duration-0.001)).toBeLessThan(0.001);
    expect(Math.abs(speed(5-0.001)-speed(5))).toBeLessThan(0.001);
  });
  it("handles boundaries, black fades, seeking, pause and reduced-motion cuts", () => {
    const player=new SequencePlayer(demo);
    expect(player.seek(0).position.toArray()).toEqual(demo.shots[0].position[0]);
    expect(player.seek(9.999).opacity).toBeGreaterThan(0.99);
    expect(player.seek(10).opacity).toBe(1);
    expect(player.seek(10).shot.id).toBe("table-detail");
    expect(player.seek(10.5).opacity).toBe(0);
    expect(player.seek(2,true).position.toArray()).toEqual(demo.shots[0].position[0]);
    expect(player.seek(999).finished).toBe(true);
    player.seek(2); player.update(1); expect(player.elapsed).toBe(2);
    player.paused=false; player.update(1); expect(player.elapsed).toBe(3);
    const camera=new PerspectiveCamera(); player.apply(camera,player.seek(0));
    expect(camera.fov).toBe(demo.shots[0].fov);
    expect(() => player.seek(NaN)).toThrow();
    expect(() => player.update(-1)).toThrow();
  });
  it("performs hard cuts without blending when the incoming shot requests a cut", () => {
    const input=structuredClone(demo); input.shots[1].transition={type:"cut"};
    const player=new SequencePlayer(input);
    expect(player.seek(9.999).opacity).toBe(0);
    expect(player.seek(10).position.toArray()).toEqual(input.shots[1].position[0]);
  });
});
