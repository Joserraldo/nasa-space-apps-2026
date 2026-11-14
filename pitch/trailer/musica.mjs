// Genera la música y los efectos del trailer con síntesis de ffmpeg (sin samples ni licencias de terceros).
// Uso: node pitch/trailer/musica.mjs        (ffmpeg: $FFMPEG o `ffmpeg` en el PATH)
// Salida (no se sube al repo): pitch/trailer/assets/audio/musica.mp3 y sfx-*.mp3
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "assets", "audio");
mkdirSync(OUT, { recursive: true });
const FF = process.env.FFMPEG ?? "ffmpeg";
const ff = (args, nombre) => {
  execFileSync(FF, ["-y", "-loglevel", "error", ...args, "-ar", "44100", "-ac", "2", "-b:a", "192k", join(OUT, nombre)]);
  console.log("ok", nombre);
};

// Música: 60 s. Pad en La menor (A2, E3, A3, C4) con trémolo lento, un pulso grave que entra
// con la tormenta (5 s) y crece; acorde final que abre a Do mayor en el cierre (49 s).
const pad =
  "0.10*sin(2*PI*110*t)*(0.7+0.3*sin(2*PI*0.13*t))" +
  "+0.07*sin(2*PI*164.81*t)*(0.7+0.3*sin(2*PI*0.17*t+1))" +
  "+0.05*sin(2*PI*220*t)*(0.6+0.4*sin(2*PI*0.11*t+2))" +
  "+0.04*sin(2*PI*if(lt(t,49),261.63,329.63)*t)*(0.6+0.4*sin(2*PI*0.09*t+3))" +
  "+0.03*sin(2*PI*if(lt(t,49),329.63,392)*t)" +
  // pulso: 2 golpes por segundo desde los 5 s, envolvente exponencial corta
  "+if(gt(t,5),0.22*min(1,(t-5)/6)*sin(2*PI*55*t)*exp(-9*mod(t,0.5)),0)";
ff(["-f", "lavfi", "-i", `aevalsrc='${pad}':s=44100:d=60`,
  "-af", "lowpass=f=2400,aecho=0.8:0.7:120|260:0.3|0.2,afade=t=in:d=2.5,afade=t=out:st=56:d=4,volume=1.6"], "musica.mp3");

// Silbido de la tormenta: ruido rosa que sube durante 3 s.
ff(["-f", "lavfi", "-i", "anoisesrc=c=pink:d=3.2:a=0.5:seed=7",
  "-af", "highpass=f=300,lowpass=f=5000,afade=t=in:d=2.6:curve=exp,afade=t=out:st=2.9:d=0.3,volume=0.9"], "sfx-viento.mp3");

// Encendido del escudo: golpe grave + barrido ascendente.
ff(["-f", "lavfi", "-i", "aevalsrc='0.9*sin(2*PI*(45+260*t*t)*t)*exp(-2.2*t)+0.5*sin(2*PI*70*t)*exp(-5*t)':s=44100:d=1.6",
  "-af", "lowpass=f=3000,aecho=0.8:0.6:90:0.3"], "sfx-escudo.mp3");

// Falla de Iris: pitidos digitales cortados (onda cuadrada que salta de tono).
ff(["-f", "lavfi", "-i", "aevalsrc='0.35*sgn(sin(2*PI*(600+500*floor(mod(t*13,4)))*t))*gt(mod(t*9,1),0.45)':s=44100:d=2.4",
  "-af", "lowpass=f=4000,afade=t=out:st=2.1:d=0.3"], "sfx-falla.mp3");

// Clic de interfaz para los cortes del juego.
ff(["-f", "lavfi", "-i", "aevalsrc='0.6*sin(2*PI*1800*t)*exp(-60*t)':s=44100:d=0.15"], "sfx-clic.mp3");
