"use client";

import { useEffect, useRef } from "react";

/**
 * SpaceBackground — a single full-viewport WebGL starfield that lives BEHIND the
 * entire site (fixed, pointer-events-none, z -10). Multi-depth drifting +
 * twinkling gold/white stars with parallax and a faint gold nebula, so the whole
 * page sits inside living space — not just the hero. Cheap: a few Points layers,
 * twinkle done in-shader, only a time uniform animates per frame.
 *
 * Three.js is imported at RUNTIME from a CDN (no package install). Client-only,
 * torn down on unmount. Honors prefers-reduced-motion (renders a static frame).
 */

const THREE_URL = "https://esm.sh/three@0.161.0";

export function SpaceBackground() {
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
      // Lighter field + lower DPR on phones so the background never costs frames
      // while scrolling.
      const mobile = window.matchMedia("(max-width: 768px)").matches;

      const renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.setClearColor(0x000000, 0); // transparent — dark body shows behind
      const setSize = () =>
        renderer.setSize(window.innerWidth, window.innerHeight);
      setSize();
      renderer.setPixelRatio(
        Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75)
      );
      const cv = renderer.domElement;
      cv.style.width = "100%";
      cv.style.height = "100%";
      cv.style.display = "block";
      mount.appendChild(cv);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.1,
        2000
      );
      camera.position.z = 600;

      // ── Star layer factory ───────────────────────────────────────────────────
      // Each layer is a slab of stars at a depth band; nearer layers are bigger and
      // drift faster (parallax). Twinkle + round soft points done in the shader.
      const layers: any[] = [];
      const makeLayer = (
        count: number,
        spreadZ: [number, number],
        size: number,
        warmth: number, // 0=white .. 1=gold
        speed: number
      ) => {
        const pos = new Float32Array(count * 3);
        const ph = new Float32Array(count);
        const sz = new Float32Array(count);
        for (let i = 0; i < count; i++) {
          pos[i * 3] = (Math.random() - 0.5) * 2200;
          pos[i * 3 + 1] = (Math.random() - 0.5) * 1500;
          pos[i * 3 + 2] = spreadZ[0] + Math.random() * (spreadZ[1] - spreadZ[0]);
          ph[i] = Math.random() * Math.PI * 2;
          sz[i] = 0.5 + Math.random() * 1.0;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        geo.setAttribute("aPhase", new THREE.BufferAttribute(ph, 1));
        geo.setAttribute("aSize", new THREE.BufferAttribute(sz, 1));
        const mat = new THREE.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          uniforms: {
            uTime: { value: 0 },
            uSize: { value: size * renderer.getPixelRatio() },
            uWarm: { value: warmth },
            uMouse: { value: new THREE.Vector2(0, 0) }, // cursor in NDC (-1..1)
            uAspect: { value: window.innerWidth / window.innerHeight },
            uLens: { value: 0 }, // 0 until the cursor first moves (no warp at load)
          },
          vertexShader: `
            attribute float aPhase; attribute float aSize;
            uniform float uTime; uniform float uSize;
            uniform vec2 uMouse; uniform float uAspect; uniform float uLens;
            varying float vTw; varying float vSz;
            void main(){
              vec4 mv = modelViewMatrix * vec4(position, 1.0);
              vec4 clip = projectionMatrix * mv;

              // ---- Gargantua cursor lens: swirl + pull nearby stars toward the
              // cursor, like light bending into a gravity well. Falls off to zero
              // past the influence radius, so the rest of the field is untouched.
              vec2 ndc = clip.xy / clip.w;
              vec2 p = vec2(ndc.x * uAspect, ndc.y);
              vec2 m = vec2(uMouse.x * uAspect, uMouse.y);
              vec2 rel = p - m;
              float d = length(rel);
              float R = 0.62;                       // influence radius
              float k = smoothstep(R, 0.0, d) * uLens;
              float ang = k * 1.8;                  // swirl strength near cursor
              float s = sin(ang), c = cos(ang);
              rel = mat2(c, -s, s, c) * rel;        // rotate around cursor
              rel *= mix(1.0, 0.42, k);             // compress inward (the well)
              p = m + rel;
              ndc = vec2(p.x / uAspect, p.y);
              clip.xy = ndc * clip.w;

              float tw = 0.82 + 0.18 * sin(uTime * 0.7 + aPhase);
              vTw = tw; vSz = aSize;
              float ps = uSize * aSize * (300.0 / -mv.z) * (0.92 + 0.08*tw);
              gl_PointSize = max(ps, 1.7);   // floor so tiny stars never sub-pixel flicker
              gl_Position = clip;
            }
          `,
          fragmentShader: `
            precision mediump float;
            uniform float uWarm; varying float vTw; varying float vSz;
            void main(){
              vec2 d = gl_PointCoord - 0.5;
              float r = length(d);
              if (r > 0.5) discard;
              float a = smoothstep(0.5, 0.0, r);
              a *= a; // soft round falloff
              vec3 white = vec3(0.95, 0.96, 1.0);
              vec3 gold  = vec3(1.0, 0.82, 0.42);
              vec3 c = mix(white, gold, uWarm);
              gl_FragColor = vec4(c, a * vTw);
            }
          `,
        });
        const pts = new THREE.Points(geo, mat);
        pts.userData.speed = speed;
        scene.add(pts);
        layers.push({ pts, geo, mat });
      };

      const m = mobile ? 0.45 : 1; // fewer stars on phones (same look, far cheaper)
      makeLayer(Math.round(900 * m), [-400, 100], 1.0, 0.15, 0.6); // far, mostly white
      makeLayer(Math.round(520 * m), [100, 400], 1.7, 0.45, 1.0); // mid, warmer
      makeLayer(Math.round(220 * m), [400, 560], 2.6, 0.8, 1.7); // near, gold, bigger

      // ── Faint gold nebula haze (a couple of big additive sprites) ─────────────
      const makeNebula = () => {
        const c = document.createElement("canvas");
        c.width = c.height = 256;
        const g = c.getContext("2d")!;
        const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
        grd.addColorStop(0, "rgba(227,178,79,0.5)");
        grd.addColorStop(0.4, "rgba(184,128,31,0.18)");
        grd.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = grd;
        g.fillRect(0, 0, 256, 256);
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
      };
      const nebTex = makeNebula();
      const nebulae: any[] = [];
      // Very faint - just a whisper of depth, not visible patches against the
      // uniform space-black.
      const nebSpecs = [
        { x: -650, y: 250, z: -100, s: 900, o: 0.05 },
        { x: 700, y: -200, z: 0, s: 1100, o: 0.04 },
        { x: 120, y: 380, z: 200, s: 700, o: 0.03 },
      ];
      const nebMat = new THREE.SpriteMaterial({
        map: nebTex,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      nebSpecs.forEach((n) => {
        const sp = new THREE.Sprite(nebMat.clone());
        sp.material.opacity = n.o;
        sp.position.set(n.x, n.y, n.z);
        sp.scale.setScalar(n.s);
        sp.userData.base = { x: n.x, y: n.y, o: n.o };
        scene.add(sp);
        nebulae.push(sp);
      });

      // ── Cursor (NDC) for the Gargantua gravity lens ───────────────────────────
      const tgt = { x: 0, y: 0 };
      const cur = { x: 0, y: 0 };
      let moved = false;
      let lensVal = 0;
      const onMove = (e: PointerEvent) => {
        tgt.x = (e.clientX / window.innerWidth) * 2 - 1;
        tgt.y = -((e.clientY / window.innerHeight) * 2 - 1);
        moved = true;
      };
      if (!reduce) window.addEventListener("pointermove", onMove, { passive: true });

      const clock = new THREE.Clock();
      let running = false;
      const render = () => {
        const t = clock.getElapsedTime();
        // Ease the cursor + lens strength so the well glides instead of snapping.
        cur.x += (tgt.x - cur.x) * 0.12;
        cur.y += (tgt.y - cur.y) * 0.12;
        lensVal += ((moved ? 1 : 0) - lensVal) * 0.05;
        layers.forEach(({ pts, mat }) => {
          mat.uniforms.uTime.value = t;
          if (!reduce) {
            // Smooth, looping drift (sinusoidal - never wraps, so no jump/flicker).
            pts.position.x = Math.sin(t * 0.02) * 22 * pts.userData.speed;
            pts.position.y = Math.cos(t * 0.016) * 16 * pts.userData.speed;
            pts.rotation.z = t * 0.0025 * pts.userData.speed;
            mat.uniforms.uMouse.value.set(cur.x, cur.y);
            mat.uniforms.uLens.value = lensVal;
          }
        });
        if (!reduce) {
          nebulae.forEach((sp, i) => {
            sp.material.opacity =
              sp.userData.base.o * (0.7 + 0.3 * Math.sin(t * 0.2 + i));
          });
        }
        renderer.render(scene, camera);
        raf = requestAnimationFrame(render);
      };

      // Reduced motion -> one static frame, no loop. Otherwise run, but pause the
      // whole loop whenever the tab is hidden (saves battery/GPU in background).
      const start = () => {
        if (running || reduce) return;
        running = true;
        raf = requestAnimationFrame(render);
      };
      const stop = () => {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      };
      if (reduce) {
        renderer.render(scene, camera); // single static frame
      } else {
        start();
      }
      const onVis = () => {
        if (document.hidden) stop();
        else start();
      };
      document.addEventListener("visibilitychange", onVis);

      const onResize = () => {
        setSize();
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        const a = window.innerWidth / window.innerHeight;
        layers.forEach(({ mat }) => (mat.uniforms.uAspect.value = a));
      };
      window.addEventListener("resize", onResize);

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("resize", onResize);
        document.removeEventListener("visibilitychange", onVis);
        renderer.dispose();
        nebTex.dispose();
        nebMat.dispose();
        nebulae.forEach((s) => s.material.dispose());
        layers.forEach(({ geo, mat }) => {
          geo.dispose();
          mat.dispose();
        });
        if (cv.parentNode === mount) mount.removeChild(cv);
      };
    })().catch((err) => console.warn("[SpaceBackground] init failed:", err));

    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      cleanup?.();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
    />
  );
}
