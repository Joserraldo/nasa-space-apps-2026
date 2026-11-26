/** Stop actual WebGL work when the document or preview is hidden. Reset time on resume. */
export function startLoop(container: HTMLElement, frame: (delta:number) => void) {
  let request = 0, last = 0, skipped = false, disposed = false;
  const tick = (now:number) => {
    request=0;
    if (disposed || document.hidden || skipped) {last=0; return;}
    frame(last ? Math.min((now-last)/1000,0.1) : 0);
    last=now; request=requestAnimationFrame(tick);
  };
  const resume = () => {
    if (!disposed && !document.hidden && !skipped && !request) request=requestAnimationFrame(tick);
  };
  const visibility = () => {
    if (document.hidden || skipped) { cancelAnimationFrame(request); request=0; last=0; }
    else resume();
  };
  const contentVisibility = (event:Event) => { skipped=(event as Event & {skipped:boolean}).skipped; visibility(); };
  let observer: IntersectionObserver | undefined;
  if ("oncontentvisibilityautostatechange" in container) {
    container.addEventListener("contentvisibilityautostatechange",contentVisibility);
  } else {
    observer=new IntersectionObserver(entries => { skipped=!entries[0].isIntersecting; visibility(); });
    observer.observe(container);
  }
  document.addEventListener("visibilitychange",visibility); resume();
  return () => {
    disposed=true; cancelAnimationFrame(request); observer?.disconnect();
    document.removeEventListener("visibilitychange",visibility);
    container.removeEventListener("contentvisibilityautostatechange",contentVisibility);
  };
}
