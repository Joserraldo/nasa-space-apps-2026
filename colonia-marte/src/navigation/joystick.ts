export interface JoystickState { x:number; y:number; active:boolean }

/** Migrated pointer capture, dead zone and nonlinear ramp from mars-base-three. */
export function createJoystick(container: HTMLElement) {
  const knob = container.querySelector<HTMLElement>(".joystick-knob")!;
  const state: JoystickState = {x:0,y:0,active:false};
  let pointer: number | null = null;
  const reset = () => { pointer=null; state.x=state.y=0; state.active=false; knob.style.transform="translate(0,0)"; };
  const move = (event:PointerEvent) => {
    if (event.pointerId!==pointer) return;
    const rect=container.getBoundingClientRect(), radius=rect.width*0.38;
    const x=event.clientX-rect.left-rect.width/2, y=event.clientY-rect.top-rect.height/2;
    const distance=Math.hypot(x,y), magnitude=Math.min(1,distance/radius), deadzone=0.08;
    const scaled=Math.max(0,(magnitude-deadzone)/(1-deadzone));
    const curved=scaled*(0.55+0.45*scaled);
    state.x=distance ? x/distance*curved : 0;
    state.y=distance ? -y/distance*curved : 0;
    knob.style.transform=`translate(${distance ? x/distance*magnitude*radius : 0}px,${distance ? y/distance*magnitude*radius : 0}px)`;
  };
  const down = (event:PointerEvent) => {
    if (pointer!==null || event.button!==0) return;
    pointer=event.pointerId; state.active=true; container.setPointerCapture(pointer); move(event);
  };
  const up = (event:PointerEvent) => {if (event.pointerId===pointer) reset();};
  container.addEventListener("pointerdown",down); container.addEventListener("pointermove",move);
  container.addEventListener("pointerup",up); container.addEventListener("pointercancel",up);
  container.addEventListener("lostpointercapture",up); window.addEventListener("blur",reset);
  return {state,reset,setVisible(visible:boolean) {container.hidden=!visible; if (!visible) reset();},
    dispose() {
      reset(); container.removeEventListener("pointerdown",down); container.removeEventListener("pointermove",move);
      container.removeEventListener("pointerup",up); container.removeEventListener("pointercancel",up);
      container.removeEventListener("lostpointercapture",up); window.removeEventListener("blur",reset);
    },
  };
}
