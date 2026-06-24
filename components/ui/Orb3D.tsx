"use client";

import { useEffect, useRef } from "react";

/**
 * Orb3D - the DS Universe emblem as a gold "Gargantua" black hole.
 *
 * A fragment shader raymarches photon paths through a Schwarzschild gravity well.
 * The accretion disk is near edge-on; light bending lenses its far side up and
 * OVER the top (and under the bottom), closing it into the signature ring while
 * the disk still flares out horizontally to both sides. A bright photon ring
 * hugs the circular shadow. The plasma ORBITS over time (gravitational motion).
 * Rich gold throughout; fades out before the canvas edge so it blends - no box.
 *
 * Three.js is imported at RUNTIME from a CDN (no package install). Client-only,
 * torn down on unmount, SSR-safe. Honors prefers-reduced-motion (freezes motion).
 */

const THREE_URL = "https://esm.sh/three@0.161.0";

const FRAG = `
precision highp float;
varying vec2 vUv;
uniform float uAspect;
uniform float uTime;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f*f*(3.0-2.0*f);
  float a = hash(i), b = hash(i+vec2(1.0,0.0));
  float c = hash(i+vec2(0.0,1.0)), d = hash(i+vec2(1.0,1.0));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
}
float fbm(vec2 p){
  float s = 0.0, a = 0.55;
  for(int i=0;i<5;i++){ s += a*vnoise(p); p = p*2.02 + 1.7; a *= 0.5; }
  return s;
}

// Sparse starfield sampled by direction. Because the ray direction is bent by
// gravity before this is called, the stars LENS (warp) around the black hole.
float stars(vec3 dir){
  vec2 a = vec2(atan(dir.z, dir.x), asin(clamp(dir.y, -1.0, 1.0)));
  vec2 g = a * vec2(7.0, 11.0);
  vec2 cell = floor(g);
  float h = hash(cell);
  if(h < 0.92) return 0.0;
  vec2 f = fract(g) - 0.5;
  return smoothstep(0.16, 0.0, length(f)) * (0.4 + 0.6 * hash(cell + 3.3));
}

// disk emission at a plane-crossing point cp (gold plasma + doppler + orbit)
vec4 disk(vec3 cp, vec3 rd, float rIn, float rOut){
  float dr = length(cp.xz);
  if(dr < rIn || dr > rOut) return vec4(0.0);
  float u = (dr - rIn) / (rOut - rIn);          // 0 inner .. 1 outer
  float temp = pow(1.0 - u, 0.42);              // hotter inside, but keep the wide flare

  // Orbiting turbulence: a radius-dependent rotation (faster inner) advected by
  // time gives the live gravitational swirl. Seam-free (sampled in-plane).
  // Rigid rotation (same angular speed at every radius) so the pattern spins
  // smoothly forever without winding up / shearing - consistent over time.
  float orbit = uTime * 0.32;
  float sw = log(dr + 0.5) * 2.4 + orbit;
  mat2 rot = mat2(cos(sw), -sin(sw), sin(sw), cos(sw));
  vec2 q = rot * cp.xz;
  float n = fbm(q * 0.85 + vec2(uTime * 0.04, 0.0));
  float bands = fbm(q * 2.6 + 11.0);
  // Denser plasma (higher floor, fewer dark gaps) for a solid black-hole look.
  float dens = (0.6 + 0.6 * n) * (0.75 + 0.35 * bands);

  // Doppler beaming: orbital velocity, approaching side brightens hard
  vec3 vel = normalize(cross(vec3(0.0,1.0,0.0), cp));
  float beta = clamp(0.4 / sqrt(max(dr,0.6)), 0.0, 0.52);
  float cosA = dot(vel, normalize(-rd));
  float beam = pow(1.0 / max(1.0 - beta * cosA, 0.30), 2.2);

  float bright = temp * dens * beam * 1.8;

  // colour ramp: bright gold -> gold -> deep amber (rich, no washout)
  vec3 hot   = vec3(1.0, 0.90, 0.62);
  vec3 gold  = vec3(1.0, 0.72, 0.26);
  vec3 amber = vec3(0.70, 0.36, 0.07);
  vec3 c = mix(hot, gold, smoothstep(0.0, 0.30, u));
  c = mix(c, amber, smoothstep(0.4, 1.0, u));
  // Shade variation so it is not one flat sheet: dark-gold lanes + light-gold
  // filaments driven by the turbulence.
  vec3 lightGold = vec3(1.0, 0.88, 0.55);
  vec3 darkGold  = vec3(0.42, 0.20, 0.04);
  c = mix(darkGold, c, smoothstep(0.18, 0.75, n));
  c = mix(c, lightGold, smoothstep(0.72, 1.0, bands) * 0.65);

  float edge = smoothstep(0.0, 0.05, u) * smoothstep(1.0, 0.74, u);
  float a = clamp(bright * 1.15, 0.0, 1.0) * edge;
  return vec4(c * bright * edge, a);
}

void main(){
  vec2 uv = (vUv * 2.0 - 1.0);
  uv.x *= uAspect;

  // Near edge-on (Gargantua): a small inclination so the disk is almost in the
  // line of sight and its far side lenses up and over the top into a ring.
  float incl = 0.17;
  float camDist = 23.5;
  vec3 ro = vec3(0.0, sin(incl) * camDist, -cos(incl) * camDist);
  vec3 fwd = normalize(-ro);
  vec3 right = normalize(cross(fwd, vec3(0.0,1.0,0.0)));
  vec3 upv = cross(right, fwd);
  // Roll the whole Gargantua -45 deg (diagonal, matching the reference tilt).
  float roll = -0.7853981634;
  vec3 rr = right * cos(roll) + upv * sin(roll);
  upv = -right * sin(roll) + upv * cos(roll);
  right = rr;
  float fov = 0.52;
  vec3 rd = normalize(fwd + uv.x * fov * right + uv.y * fov * upv);

  const float RS = 1.0;          // event horizon radius
  const float R_IN = 3.0;        // inner disk (just outside the shadow -> no overlap)
  const float R_OUT = 9.0;       // outer disk (flares wide to the sides)
  const int STEPS = 150;
  const float STEP = 0.36;

  vec3 p = ro;
  vec3 v = rd;
  vec3 acc = vec3(0.0);
  float aacc = 0.0;
  float captured = 0.0;
  float minr = 1e9;
  int xc = 0;

  for(int i=0;i<STEPS;i++){
    float r2 = dot(p, p);
    float r = sqrt(r2);
    minr = min(minr, r);
    if(r < RS){ captured = 1.0; break; }       // swallowed -> shadow
    vec3 hL = cross(p, v);
    float h2 = dot(hL, hL);
    vec3 g = -1.5 * h2 * p / pow(r2, 2.5);     // photon geodesic bending
    v += g * STEP;
    vec3 pn = p + v * STEP;
    if(p.y * pn.y < 0.0){                       // disk-plane crossing
      xc += 1;
      float t = p.y / (p.y - pn.y);
      vec3 cp = mix(p, pn, t);
      vec4 d = disk(cp, v, R_IN, R_OUT);
      // Only the first (solid) disk crossing is drawn. The later lensed crossing
      // is what produced the secondary "double-chin" circle below the ring -
      // dropped entirely.
      float w = xc <= 1 ? 1.0 : 0.0;
      acc += d.rgb * w * (1.0 - aacc);
      aacc += d.a * w * (1.0 - aacc);
    }
    p = pn;
    if(aacc > 0.995) break;
  }

  // (In-orb lensed stars removed - they read as messy clutter. The global
  // SpaceBackground starfield behind the page provides the stars instead.)

  // Photon ring: a bright thin gold ring hugging the shadow (rays grazing the
  // photon sphere). Sits at the shadow edge, OUTSIDE which the disk flares.
  float dphot = abs(minr - 1.5 * RS);
  float ringCore = smoothstep(0.07, 0.0, dphot) * (1.0 - captured);
  float ringGlow = smoothstep(0.22, 0.0, dphot) * (1.0 - captured);
  acc += vec3(1.0, 0.92, 0.66) * ringCore * 3.0;
  acc += vec3(1.0, 0.80, 0.42) * pow(ringGlow, 2.0) * 0.45;
  aacc = max(aacc, max(ringCore, ringGlow * 0.45));

  // (No outer bloom halo - keep the background clean/dark, no stray glow.)

  // edge fade so the wide disk dissolves before the canvas border (no box, no
  // halo bars at the edges).
  float vign = smoothstep(1.02, 0.7, length(vUv * 2.0 - 1.0));
  float alpha = clamp(aacc, 0.0, 1.0) * vign;

  acc = acc * vign;
  acc = acc / (acc + vec3(0.42));            // Reinhard
  acc = pow(acc, vec3(0.80));
  // rich gold grade: kill blue so highlights read gold, push saturation
  acc *= vec3(1.2, 0.9, 0.42);
  float lum = dot(acc, vec3(0.3, 0.59, 0.11));
  acc = max(mix(vec3(lum), acc, 1.4), 0.0);
  gl_FragColor = vec4(acc, alpha);
}
`;

const VERT = `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

type Orb3DProps = {
  size?: number;
  className?: string;
};

export function Orb3D({ size = 480, className }: Orb3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let disposed = false;
    let raf = 0;
    let cleanup: (() => void) | null = null;

    (async () => {
      const THREE: any = await import(
        /* webpackIgnore: true */ /* turbopackIgnore: true */ THREE_URL
      );
      if (disposed || !mountRef.current) return;

      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.setClearColor(0x000000, 0);
      renderer.setSize(size, size);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.domElement.style.display = "block";
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.Camera();

      const mat = new THREE.ShaderMaterial({
        transparent: true,
        depthTest: false,
        depthWrite: false,
        uniforms: { uAspect: { value: 1 }, uTime: { value: 0 } },
        vertexShader: VERT,
        fragmentShader: FRAG,
      });
      const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
      scene.add(quad);

      const clock = new THREE.Clock();
      const renderOnce = () => {
        mat.uniforms.uTime.value = reduce ? 0 : clock.getElapsedTime();
        renderer.render(scene, camera);
      };

      // Pause control: only burn GPU when the orb is on-screen AND the tab is
      // visible. Static frame for reduced-motion (render once, never loop).
      let running = false;
      let onScreen = true;
      const loop = () => {
        renderOnce();
        raf = requestAnimationFrame(loop);
      };
      const start = () => {
        if (running || reduce) return;
        running = true;
        raf = requestAnimationFrame(loop);
      };
      const stop = () => {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      };
      const sync = () => {
        if (onScreen && !document.hidden) start();
        else stop();
      };

      renderOnce(); // first paint immediately
      if (reduce) {
        // static: nothing else to do
      } else {
        sync();
      }

      const io = new IntersectionObserver(
        (entries) => {
          onScreen = entries[0]?.isIntersecting ?? true;
          sync();
        },
        { rootMargin: "120px" }
      );
      io.observe(mount);
      const onVis = () => sync();
      document.addEventListener("visibilitychange", onVis);

      const ro = new ResizeObserver(() => {
        const s = mount.clientWidth || size;
        renderer.setSize(s, s, false);
        if (!running) renderOnce(); // keep a crisp frame while paused
      });
      ro.observe(mount);

      cleanup = () => {
        stop();
        io.disconnect();
        ro.disconnect();
        document.removeEventListener("visibilitychange", onVis);
        renderer.dispose();
        quad.geometry.dispose();
        mat.dispose();
        if (renderer.domElement.parentNode === mount)
          mount.removeChild(renderer.domElement);
      };
    })().catch((err) => console.warn("[Orb3D] init failed:", err));

    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      cleanup?.();
    };
  }, [size]);

  return (
    <div
      ref={mountRef}
      className={className}
      style={{ width: size, height: size }}
      aria-hidden
    />
  );
}
