import { describe, expect, it } from "vitest";
import { createResolutionGovernor, deviceProfile } from "../../src/navigation/mobile-optimizer";

describe("mobile balanced resolution", () => {
  it("classifies touch phones and caps pixel ratio", () => {
    expect(deviceProfile(true,390,844,3)).toEqual({mode:"balanced",maxPixelRatio:1.5,minPixelRatio:1});
    expect(deviceProfile(false,1920,1080,1).mode).toBe("desktop");
  });
  it("reduces slow samples, recovers, resets and never exceeds bounds", () => {
    const applied:number[]=[], governor=createResolutionGovernor(1.5,ratio=>applied.push(ratio));
    for (let i=0;i<900;i++) governor.update(0.04);
    expect(governor.ratio).toBe(1);
    for (let i=0;i<900;i++) governor.update(0.012);
    expect(governor.ratio).toBe(1.5);
    for (let i=0;i<45;i++) governor.update(0.04);
    expect(governor.ratio).toBeLessThan(1.5);
    governor.reset(); expect(governor.ratio).toBe(1.5); expect(applied.at(-1)).toBe(1.5);
    expect(applied.every(ratio=>ratio>=1&&ratio<=1.5)).toBe(true);
  });
});
