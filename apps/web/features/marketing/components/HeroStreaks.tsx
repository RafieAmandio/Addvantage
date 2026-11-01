"use client";

import { useEffect, useRef } from "react";

const VERT = "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}";

/*
 * Diagonal slats of light, one per loop pass, painted back to front. Each slat
 * has a hard lower edge and dissolves toward the upper one through a per pixel
 * dither, which is where the grain comes from.
 */
const FRAG = `
precision mediump float;
uniform vec2 R;
uniform float T;
uniform vec2 M;
float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){
  vec2 p=(gl_FragCoord.xy-.5*R)/min(R.x*1.6,R.y*1.25);
  p-=M*.025;
  float u=dot(p,vec2(.7071,-.7071));
  float v=dot(p,vec2(.7071,.7071));
  float g=h(gl_FragCoord.xy);
  vec3 col=vec3(0.);
  vec2 q=gl_FragCoord.xy/R;
  float fade=smoothstep(.12,.42,q.y);
  for(int i=0;i<8;i++){
    float f=float(i);
    float k=f-3.5;
    float c=k*.17+sin(T*.11+f*1.9)*.018;
    float w=.125+.03*sin(f*2.7);
    float a=(v-c)/w;
    if(a<0.||a>1.)continue;
    float mid=sin(f*3.1)*.08+sin(T*.07+f)*.04;
    float len=.5-abs(k)*.06;
    float along=1.-smoothstep(len*.3,len,abs(u-mid));
    float across=smoothstep(0.,.03,a)*(1.-smoothstep(.4,1.,a));
    float I=across*along*(1.-abs(k)*.1)*fade;
    float m=smoothstep(.03,.24,I+(g-.5)*.2);
    vec3 deep=vec3(.35,.12,.0);
    vec3 amber=vec3(.74,.34,.0);
    vec3 gold=vec3(.9,.66,.0);
    vec3 bc=mix(deep,mix(amber,gold,smoothstep(.4,.9,I)),smoothstep(.08,.5,I));
    col=mix(col,bc,m);
  }
  gl_FragColor=vec4(col,1.);
}`;

/** Raycast style light bars in our yellow, WebGL, paused off screen and frozen under reduced motion. */
export function HeroStreaks({ className }: { className?: string }) {
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

    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Phones get fewer pixels: the dither carries the look at any resolution.
    const dpr = Math.min(devicePixelRatio, innerWidth < 768 ? 1 : 1.5);
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    let raf = 0;
    let visible = true;
    const t0 = performance.now();

    const size = () => {
      cv.width = Math.round(cv.clientWidth * dpr);
      cv.height = Math.round(cv.clientHeight * dpr);
      gl.viewport(0, 0, cv.width, cv.height);
      gl.uniform2f(uR, cv.width, cv.height);
    };
    const draw = () => {
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;
      gl.uniform1f(uT, calm ? 0 : (performance.now() - t0) / 1000);
      gl.uniform2f(uM, mouse.x, mouse.y);
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
      mouse.tx = (e.clientX / innerWidth) * 2 - 1;
      mouse.ty = -((e.clientY / innerHeight) * 2 - 1);
    };
    if (!calm) addEventListener("pointermove", move, { passive: true });
    start();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      removeEventListener("pointermove", move);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className={className} />;
}
