"use client";

import { useEffect, useRef } from "react";

const VERT = "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}";

/*
 * An LED board: a grid of square dots, mostly dim. Slow noise blobs of yellow
 * light wash through it, strongest behind and below the headline, warming
 * around the cursor. A rare dot blinks bright, like a pixel updating.
 */
const FRAG = `
precision mediump float;
uniform vec2 R;
uniform float T;
uniform vec3 M;
uniform float C;
float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}
void main(){
  vec2 cell=floor(gl_FragCoord.xy/C);
  vec2 l=fract(gl_FragCoord.xy/C)-.5;
  float dot_=step(max(abs(l.x),abs(l.y)),.22);
  vec2 c=(cell+.5)*C;
  vec2 p=(c-.5*R)/R.y;
  float t=T*.05;
  float blob=n(p*1.6+vec2(t+13.7,-t*.7+4.3))*.6+n(p*3.1-vec2(t*.8,t*.4)+vec2(27.1,9.4))*.4;
  vec2 e=(p-vec2(0.,-.04))*vec2(.5,1.);
  float env=exp(-dot(e,e)*3.6);
  float L=(.22+1.05*smoothstep(.3,.8,blob))*env;
  L*=smoothstep(.16,.42,c.y/R.y)*smoothstep(1.02,.8,c.y/R.y);
  vec2 dm=(c-M.xy)/R.y;
  L+=M.z*.55*exp(-dot(dm,dm)*28.);
  float f=step(.9985,h(cell+floor(T*3.)))*smoothstep(.35,.7,env)*.7;
  L=clamp(L+f,0.,1.);
  vec3 dim=vec3(.075);
  vec3 amber=vec3(.72,.33,.0);
  vec3 gold=vec3(1.,.83,.0);
  vec3 col=mix(dim,mix(amber,gold,smoothstep(.5,.95,L)),smoothstep(.04,.5,L));
  gl_FragColor=vec4(col*dot_,1.);
}`;

/** Dot-matrix glow behind the hero, WebGL, paused off screen and frozen under reduced motion. */
export function HeroDots({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    const gl = cv?.getContext("webgl", { antialias: false, premultipliedAlpha: false });
    if (!cv || !gl) return;
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const pr = gl.createProgram()!;
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
    gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const uR = gl.getUniformLocation(pr, "R");
    const uT = gl.getUniformLocation(pr, "T");
    const uM = gl.getUniformLocation(pr, "M");
    const uC = gl.getUniformLocation(pr, "C");

    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Phones get fewer pixels: the dither carries the look at any resolution.
    const dpr = Math.min(devicePixelRatio, innerWidth < 768 ? 1 : 1.5);
    const mouse = { x: 0, y: 0, z: 0, tx: 0, ty: 0, tz: 0 };
    let raf = 0;
    let visible = true;
    const t0 = performance.now();

    const size = () => {
      cv.width = Math.round(cv.clientWidth * dpr);
      cv.height = Math.round(cv.clientHeight * dpr);
      gl.viewport(0, 0, cv.width, cv.height);
      gl.uniform2f(uR, cv.width, cv.height);
      gl.uniform1f(uC, Math.round(7 * dpr));
    };
    const draw = () => {
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;
      mouse.z += (mouse.tz - mouse.z) * 0.04;
      gl.uniform1f(uT, calm ? 0 : (performance.now() - t0) / 1000);
      gl.uniform3f(uM, mouse.x, mouse.y, mouse.z);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const loop = () => {
      draw();
      raf = visible ? requestAnimationFrame(loop) : 0;
    };
    const start = () => {
      if (!raf && !calm) raf = requestAnimationFrame(loop);
    };

    size();
    draw();
    const ro = new ResizeObserver(() => {
      size();
      draw();
    });
    ro.observe(cv);
    const io = new IntersectionObserver(([e]) => {
      visible = !!e?.isIntersecting;
      if (visible) start();
    });
    io.observe(cv);
    const move = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      mouse.tx = (e.clientX - r.left) * dpr;
      mouse.ty = (r.bottom - e.clientY) * dpr;
      if (!mouse.z && !mouse.tz) {
        mouse.x = mouse.tx;
        mouse.y = mouse.ty;
      }
      mouse.tz = e.pointerType === "mouse" ? 1 : 0;
    };
    const leave = () => (mouse.tz = 0);
    if (!calm) cv.parentElement?.addEventListener("pointerleave", leave);
    if (!calm) addEventListener("pointermove", move, { passive: true });
    start();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      removeEventListener("pointermove", move);
      cv.parentElement?.removeEventListener("pointerleave", leave);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className={className} />;
}
