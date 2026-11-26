import { AnimationMixer, Mesh, type Object3D } from "three";
import { createReviewShell, addSelect } from "../core/review-shell";
import { createRendering } from "../core/rendering";
import { startLoop } from "../core/loop";
import { createProductionRegistry } from "../kit/pieces";
import { irisExpressions } from "../materials/iris-faces";
import { getScreens } from "../materials/screens";
import { materials } from "../materials/shared";
import { coloredGeometry } from "../materials/uv";
import { chamferBox } from "../kit/primitives";
import { crewMembers, loadBaseCharacter, loadCrewMember } from "../kit/pieces/crew/load-character";

export async function mountCrewReview() {
  const shell = createReviewShell("Crew", "Iris expressions and the base character A-pose. Visual approval pending.");
  const view = addSelect(shell.controls, "crew-view", "Review asset", ["Crew lineup", "Iris expressions", "Base A-pose"]);
  const status = document.createElement("p"); status.setAttribute("role", "status"); shell.controls.append(status);
  const list = document.createElement("ol");
  irisExpressions.forEach(expression => {
    const item = document.createElement("li"); item.textContent = expression; list.append(item);
  });
  shell.controls.append(list);
  getScreens();
  const rendering = createRendering(shell.viewport);
  const { scene, camera, renderer, composer } = rendering;
  const floor = new Mesh(coloredGeometry(chamferBox(12, 0.1, 3, 0.03), "offWhite"), materials.M_palette);
  floor.position.y = -0.1; scene.add(floor);
  const registry = createProductionRegistry();
  const rovers = irisExpressions.map((expression, i) => {
    const iris = registry.build("CH-09", { expression });
    iris.position.x = (i - 2) * 1.8; scene.add(iris); return iris;
  });
  let character: Awaited<ReturnType<typeof loadBaseCharacter>> | undefined;
  try {
    const asset = new URLSearchParams(window.location.search).get("character") === "tess" ? "tess" : "base-a";
    character = await loadBaseCharacter(asset); character.visible = false; scene.add(character);
    status.textContent = "Base character loaded. A-pose; no animation variants produced.";
  } catch (error) {
    status.textContent = "Base GLB unavailable. Run tools/blender/run.ps1 with tools/blender/build_base.py.";
    console.warn("Base character unavailable", error);
  }
  const lineup: Object3D[] = [];
  const mixers: AnimationMixer[] = [];
  await Promise.all([...crewMembers, "eva" as const].map(async (member, i) => {
    try {
      const { scene: body, animations } = await loadCrewMember(member);
      body.position.x = (i - 2) * 1.3; body.visible = false; scene.add(body); lineup.push(body);
      const idle = animations.find(clip => clip.name === "Idle");
      if (idle) { const mixer = new AnimationMixer(body); mixer.clipAction(idle).play(); mixers.push(mixer); }
    } catch (error) { console.warn(`Crew member unavailable: ${member}`, error); }
  }));
  const selectView = () => {
    const mode = view.value;
    rovers.forEach(rover => { rover.visible = mode === "Iris expressions"; });
    if (character) character.visible = mode === "Base A-pose";
    lineup.forEach(body => { body.visible = mode === "Crew lineup"; });
    if (mode === "Crew lineup") { camera.position.set(0, 1.5, 6.6); camera.lookAt(0, 0.95, 0); }
    else if (mode === "Base A-pose") { camera.position.set(2.8, 1.8, 4.5); camera.lookAt(0, 0.95, 0); }
    else { camera.position.set(2.8, 3.2, 11.5); camera.lookAt(0, 0.5, 0); }
    camera.fov = 48; camera.updateProjectionMatrix();
    shell.status.textContent = mode === "Crew lineup" ? `CREW + EVA / ${lineup.length} OF 5 / IDLE`
      : mode === "Base A-pose" ? (character ? "A-POSE" : "GLB UNAVAILABLE") : "CH-09 / FIVE EXPRESSIONS";
  };
  selectView(); view.onchange = selectView;
  const stop = startLoop(shell.viewport, dt => {
    mixers.forEach(mixer => mixer.update(dt));
    renderer.info.reset(); composer.render(dt);
    shell.metrics.textContent = `draw calls ${renderer.info.render.calls} | ` +
      `triangles ${renderer.info.render.triangles}`;
  });
  window.addEventListener("pagehide", () => { stop(); rendering.dispose(); }, { once: true });
}
