import * as T from './vendor/three.module.js';

// Reference factories. Dimensions are art-production units, not NASA measurements.
const sharedGeometry = new Map();
const geometry = (id, make) => {
  if (!sharedGeometry.has(id)) sharedGeometry.set(id, make());
  return sharedGeometry.get(id);
};
const material = (color, extra = {}) => new T.MeshStandardMaterial({ color, roughness: .8, flatShading: true, ...extra });
export const palette = {
  ivory: material('#f3e3d9'), plum: material('#8a6d9c'), indigo: material('#39346f'),
  teal: material('#50c7ce'), glass: material('#9de4ef', { transparent: true, opacity: .18, depthWrite: false, side: T.DoubleSide }),
  green: material('#7bbd39'), greenDark: material('#48934a'), soil: material('#70434a'),
  rock: material('#c47a69'), rockDark: material('#975e72'), orange: material('#ed944e'),
  glow: material('#80e7eb', { emissive: '#46aab5', emissiveIntensity: .45 }),
  skin: material('#d9976d'), hair: material('#5d3541'), black: material('#261c40'), white: material('#fff4e8'),
};
const mesh = (geo, mat, x = 0, y = 0, z = 0) => {
  const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m;
};
export function box(w, h, d, mat = palette.ivory, x = 0, y = 0, z = 0) {
  const m = mesh(geometry('box', () => new T.BoxGeometry(1, 1, 1)), mat, x, y, z);
  m.scale.set(w, h, d); return m;
}
function faceted(radius, detail, mat, x = 0, y = 0, z = 0) {
  const m = mesh(geometry(`ico-${detail}`, () => new T.IcosahedronGeometry(1, detail)), mat, x, y, z); m.scale.setScalar(radius); return m;
}
function cylinder(r, h, mat, x = 0, y = 0, z = 0) {
  const m = mesh(geometry('cylinder', () => new T.CylinderGeometry(1, 1, 1, 8)), mat, x, y, z); m.scale.set(r, h, r); return m;
}
function chamferShape(w, h, c) {
  const s = new T.Shape(); const p = [[-w/2+c,0],[w/2-c,0],[w/2,c],[w/2,h-c],[w/2-c,h],[-w/2+c,h],[-w/2,h-c],[-w/2,c]];
  p.forEach(([x,y], i) => i ? s.lineTo(x,y) : s.moveTo(x,y)); s.closePath(); return s;
}
export function door() {
  const g = new T.Group(); g.name = 'Door_Frame_A';
  const outer = chamferShape(1.8, 2.5, .3), inner = chamferShape(1.25, 2.12, .2);
  const hole = new T.Path(inner.getPoints().reverse()); outer.holes.push(hole);
  const geo = geometry('door-frame', () => new T.ExtrudeGeometry(outer, { depth: .25, bevelEnabled: true, bevelSize: .06, bevelThickness: .05, bevelSegments: 1, steps: 1 }));
  g.add(mesh(geo, palette.ivory));
  const leaf = box(1.2, 2.02, .12, palette.plum, 0, 1.04, .04); leaf.name = 'Door_Leaf'; g.add(leaf);
  for (const x of [-.76,.76]) g.add(box(.08,.7,.04,palette.glow,x,1.3,.31));
  g.add(box(.65,.09,.04,palette.glow,0,2.35,.31)); return g;
}
export function rock(seed = 1, scale = 1) {
  const g = new T.Group(); g.name = 'Rock';
  const m = faceted(1, 0, seed % 2 ? palette.rock : palette.rockDark);
  m.scale.set(scale*(.7+(seed%3)*.15),scale*.55,scale*.7); m.rotation.set(seed*.17,seed*.73,seed*.11); g.add(m); return g;
}
export function leaf() {
  const geo = geometry('leaf', () => {
    const g = new T.BufferGeometry();
    const p = [0,0,0, -.22,.35,0, 0,.8,0, .22,.35,0, 0,.32,.13];
    g.setAttribute('position',new T.Float32BufferAttribute(p,3));
    g.setIndex([0,1,4,1,2,4,2,3,4,3,0,4,0,3,2,0,2,1]); g.computeVertexNormals(); return g;
  });
  return mesh(geo,palette.green);
}
export function plant(seed = 1) {
  const g = new T.Group(); g.name = 'Plant';
  g.add(cylinder(.025,.45,palette.greenDark,0,.2));
  for (let i=0;i<5;i++) { const l=leaf(); l.rotation.set(.35+(i%2)*.25,i*2.4+seed,.5); l.position.y=.1+(i%3)*.08; g.add(l); }
  return g;
}
export function planter() {
  const g = new T.Group(); g.name = 'Planter';
  g.add(box(2,.48,.72),box(1.8,.05,.58,palette.soil,0,.25),box(1.7,.05,.03,palette.glow,0,0,.38));
  for(let i=0;i<3;i++){const p=plant(i);p.position.set((i-1)*.58,.28,0);g.add(p);}return g;
}
export function solarPanel() {
  const g = new T.Group(); g.name = 'Solar_Panel';
  g.add(box(.8,.12,.6,palette.ivory,0,.06),cylinder(.09,.8,palette.plum,0,.48));
  const head = new T.Group(); head.position.y=1; head.rotation.x=-.5;
  head.add(box(1.85,.1,1.18));
  for(let x=0;x<3;x++)for(let z=0;z<2;z++)head.add(box(.54,.025,.49,palette.indigo,(x-1)*.59,.067,(z-.5)*.54));
  g.add(head);g.userData.head=head;return g;
}
export function crate() {
  const g=new T.Group();g.name='Supply_Crate';g.add(box(.65,.5,.55,palette.ivory,0,.25),box(.12,.52,.57,palette.teal,0,.26),box(.69,.08,.59,palette.ivory,0,.52));return g;
}
export function tank() {
  const g=new T.Group();g.name='Water_Tank';g.add(cylinder(.3,1.25,palette.teal,0,.75),cylinder(.36,.16,palette.ivory,0,.12),cylinder(.36,.16,palette.ivory,0,1.43));return g;
}
export function consoleUnit() {
  const g=new T.Group();g.name='Console';g.add(box(1.2,.75,.65,palette.ivory,0,.375),box(1.28,.17,.82,palette.ivory,0,.8));
  const screen=box(1.15,.72,.12,palette.indigo,0,1.2,-.26);screen.rotation.x=-.13;g.add(screen);
  for(let i=0;i<4;i++)g.add(box(.13,.12+i*.08,.025,palette.glow,(i-1.5)*.2,1.1,-.17));return g;
}
export function bench() {const g=new T.Group();g.name='Bench';g.add(box(1.8,.38,.65,palette.ivory,0,.19),box(1.6,.15,.6,palette.teal,0,.45));return g;}
export function antenna() {
  const g=new T.Group();g.name='Antenna';g.add(box(.7,.15,.7,palette.ivory,0,.075),cylinder(.09,.9,palette.plum,0,.6));
  const dish=mesh(geometry('dish',()=>new T.ConeGeometry(.72,.25,12,1,true)),palette.ivory,0,1.2);
  dish.rotation.z=.5;g.add(dish,cylinder(.035,.6,palette.teal,0,1.3));return g;
}
export const factories={door,rock,plant,planter,solarPanel,crate,tank,console:consoleUnit,bench,antenna};

export function astronaut({ child = true, accent = '#50c7ce', skin = '#d9976d', hair = '#5d3541', glasses = false } = {}) {
  const root=new T.Group();root.name=child?'Child':'Adult';
  const suit=new T.Group();root.add(suit);const a=material(accent),s=material(skin),h=material(hair);
  suit.add(box(.66,.62,.42,palette.ivory,0,1.05),box(.67,.12,.44,a,0,.8),box(.38,.44,.2,palette.ivory,0,1.07,-.3));
  const head=new T.Group();head.position.y=1.63;suit.add(head);
  const face=faceted(.37,1,s,0,.05,.035);face.scale.z=.85;head.add(face);
  const cap=faceted(.39,1,h,0,.2,-.06);cap.scale.y=.7;head.add(cap);
  for(const x of [-.12,.12]) {const eye=faceted(.034,1,palette.black,x,.09,.35);eye.scale.y=1.7;head.add(eye);}
  head.add(box(.12,.035,.02,palette.black,0,-.07,.37));
  const visor=faceted(.51,2,palette.glass,0,.07);head.add(visor);
  const collar=cylinder(.44,.12,a,0,1.42);suit.add(collar);
  if(glasses)for(const x of [-.14,.14]){const frame=mesh(new T.TorusGeometry(.095,.012,4,8),palette.ivory,x,.1,.385);head.add(frame);}
  const limbs=[];
  for(const side of [-1,1]){
    const arm=new T.Group();arm.position.set(side*.43,1.24,0);arm.add(box(.22,.43,.25,palette.ivory,0,-.2),box(.23,.18,.27,a,0,-.48));suit.add(arm);
    const leg=new T.Group();leg.position.set(side*.19,.76,0);leg.add(box(.25,.43,.28,palette.ivory,0,-.2),box(.29,.2,.45,palette.indigo,0,-.53,.06));suit.add(leg);limbs.push(arm,leg);
  }
  if(!child){suit.scale.set(.95,1.18,.95);head.scale.setScalar(.9);}root.userData={head,suit,limbs};return root;
}
export const stations=[
  {id:'airlock',x:-14,z:10,kind:'habitat',props:['crate','door']},
  {id:'control',x:0,z:-15,kind:'dome',props:['console','antenna']},
  {id:'greenhouse',x:14,z:-9,kind:'glass',props:['planter','planter','tank']},
  {id:'laboratory',x:15,z:10,kind:'habitat',props:['console','tank']},
  {id:'engineering',x:-15,z:-8,kind:'habitat',props:['solarPanel','solarPanel','crate']},
  {id:'medical',x:-6,z:-25,kind:'habitat',props:['bench','tank']},
  {id:'quarters',x:8,z:23,kind:'habitat',props:['bench','crate']},
  {id:'shelter',x:-9,z:24,kind:'shelter',props:['bench','tank']},
];
export function station(config) {
  const g=new T.Group();g.name=`Station_${config.id}`;
  g.add(cylinder(3.5,.18,palette.ivory,0,.09));
  // The open front is deliberate: a cutaway lets the same procedural kit be inspected.
  for(const x of [-2.9,2.9])g.add(box(.2,2.8,4.6,palette.ivory,x,1.55,-.4));
  g.add(box(5.9,2.8,.2,palette.ivory,0,1.55,-2.7));
  const d=door();d.position.set(-1.6,.2,.6);g.add(d);
  if(config.kind==='glass'||config.kind==='dome') {
    const dome=mesh(new T.SphereGeometry(3.2,12,5,0,Math.PI*2,0,Math.PI/2),palette.glass,0,2.85,-.4);dome.scale.y=.42;g.add(dome);
    const edge=new T.LineSegments(new T.EdgesGeometry(dome.geometry),new T.LineBasicMaterial({color:'#f3e3d9'}));edge.scale.copy(dome.scale);edge.position.copy(dome.position);g.add(edge);
  } else {g.add(box(6.1,.18,4.9,config.kind==='shelter'?palette.rock:palette.ivory,0,3,-.4));}
  config.props.forEach((id,i)=>{const prop=factories[id]();prop.position.set((i-1)*1.75,.25,-1);g.add(prop);});
  for(const x of [-2.4,2.4])g.add(box(.08,.7,.05,palette.glow,x,1.5,-2.55));
  g.position.set(config.x,0,config.z);return g;
}
export function release() {for(const g of sharedGeometry.values())g.dispose();sharedGeometry.clear();}
