export function deviceProfile(coarse:boolean, width:number, height:number, pixelRatio:number) {
  const mobile=coarse && Math.min(width,height)<=540;
  return {mode:mobile ? "balanced" : "desktop",maxPixelRatio:Math.min(pixelRatio,mobile ? 1.5 : 2),minPixelRatio:1};
}

/** Same 45-frame governor as the prototype, bounded by native DPR and synchronized with composer. */
export function createResolutionGovernor(maximum:number, apply:(ratio:number) => void) {
  const minimum=Math.min(1,maximum);
  let ratio=maximum, total=0, samples=0;
  return {
    reset() {ratio=maximum;total=samples=0;apply(ratio);},
    update(dt:number): void {
      if (!(dt>0 && dt<=0.25)) return;
      total+=dt;
      if (++samples<45) return;
      const ms=total/samples*1000; total=samples=0;
      const next=ms>28 ? Math.max(minimum,ratio-0.12) : ms<17.5 ? Math.min(maximum,ratio+0.08) : ratio;
      if (Math.abs(next-ratio)>0.001) {ratio=next; apply(ratio);}
    },
    get ratio() {return ratio;},
  };
}
