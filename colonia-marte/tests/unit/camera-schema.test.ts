import { describe, expect, it } from "vitest";
import demo from "../../data/shots/ws0-demo.json";
import { parseSequence, parseShot } from "../../src/camera/schema";

describe("shot schema T7.1", () => {
  it("parses JSON without mutating it and accepts optional DOF data", () => {
    const parsed = parseSequence(demo);
    expect(parsed).toEqual(demo);
    expect(parsed).not.toBe(demo);
    expect(parseShot({...demo.shots[0],dof:{focusDistance:3,focalLength:0.05,bokehScale:1}}).dof).toBeDefined();
  });
  for (const patch of [
    {duration:0},{duration:NaN},{fov:200},{position:[[0,1,0]]},
    {position:[[0,1,0],[0,1,0]]},{target:[[0,0,0],[Infinity,0,0]]},
    {easing:"mystery"},{environment:"AMB-09"},{transition:{type:"fade",duration:20}},
    {transition:{type:"cut",duration:1}},{dof:{focusDistance:-1}},{unknown:true},
  ]) it(`rejects invalid shot ${JSON.stringify(patch)}`, () => {
    expect(() => parseShot({...demo.shots[0],...patch})).toThrow();
  });
  it("rejects missing, duplicate and unsupported sequence data", () => {
    for (const input of [{...demo,version:2},{...demo,shots:[]},{...demo,shots:[demo.shots[0],demo.shots[0]]},null]) {
      expect(() => parseSequence(input)).toThrow();
    }
  });
  it("rejects a fade that would consume the preceding shot", () => {
    const input=structuredClone(demo); input.shots[0].duration=0.1;
    expect(() => parseSequence(input)).toThrow("previous shot");
  });
});

