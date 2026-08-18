"use client";

import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import { curvePoint } from "@/lib/aviator-curve";

type RoundState = "betting" | "running" | "crashed";

interface AviatorPlaneProps {
  multiplierRef: RefObject<number>;
  roundStateRef: RefObject<RoundState>;
}

function buildPlane() {
  const group = new THREE.Group();
  const body = new THREE.MeshStandardMaterial({
    color: 0xcdd9e3,
    roughness: 0.45,
    metalness: 0.35,
  });
  const accent = new THREE.MeshStandardMaterial({
    color: 0xffb020,
    roughness: 0.4,
    metalness: 0.1,
  });
  const dark = new THREE.MeshStandardMaterial({
    color: 0x16283a,
    roughness: 0.6,
    metalness: 0.25,
  });
  const materials = [body, accent, dark];

  const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 22, 16), body);
  fuselage.rotation.z = Math.PI / 2;
  group.add(fuselage);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(1.3, 5, 16), accent);
  nose.rotation.z = -Math.PI / 2;
  nose.position.x = 13.5;
  group.add(nose);

  const tail = new THREE.Mesh(new THREE.ConeGeometry(1.0, 4, 14), body);
  tail.rotation.z = Math.PI / 2;
  tail.position.x = -12.5;
  group.add(tail);

  const wings = new THREE.Mesh(new THREE.BoxGeometry(2.2, 20, 0.35), body);
  wings.position.set(1, 0, 0.4);
  group.add(wings);

  const tipGeo = new THREE.BoxGeometry(0.8, 3.6, 0.4);
  const tipL = new THREE.Mesh(tipGeo, accent);
  tipL.position.set(1, 8.4, 0.4);
  group.add(tipL);
  const tipR = tipL.clone();
  tipR.position.y = -8.4;
  group.add(tipR);

  const tailWings = new THREE.Mesh(new THREE.BoxGeometry(1.4, 9, 0.3), body);
  tailWings.position.set(-11, 0, 0.3);
  group.add(tailWings);

  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 3), accent);
  fin.position.set(-10.5, 0, 1.2);
  group.add(fin);

  const propeller = new THREE.Group();
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.9, 12), dark);
  hub.rotation.x = Math.PI / 2;
  propeller.add(hub);
  const bladeGeo = new THREE.BoxGeometry(0.55, 7.5, 0.12);
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3;
    const blade = new THREE.Mesh(bladeGeo, accent);
    blade.position.set(Math.sin(a) * 3.7, Math.cos(a) * 3.7, 0);
    blade.rotation.z = a;
    propeller.add(blade);
  }
  propeller.position.x = 15.2;
  group.add(propeller);

  return { group, propeller, materials };
}

function angleLerp(from: number, to: number, t: number) {
  let d = to - from;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return from + d * t;
}

export default function AviatorPlane({ multiplierRef, roundStateRef }: AviatorPlaneProps) {
  const webglRef = useRef<HTMLCanvasElement>(null);
  const fallbackRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const webglCanvas = webglRef.current;
    const fallbackCanvas = fallbackRef.current;
    const parent = webglCanvas?.parentElement;
    if (!webglCanvas || !fallbackCanvas || !parent) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let mode: "webgl" | "2d" = "2d";
    // Probe WebGL availability on a scratch canvas first. Constructing a
    // THREE.WebGLRenderer directly on a WebGL-less browser throws a noisy
    // "existing context of a different type" error every attempt (a Chrome
    // quirk: a failed webgl2 probe poisons the same canvas for webgl).
    try {
      const probe = document.createElement("canvas");
      const gl =
        probe.getContext("webgl2") ||
        probe.getContext("webgl") ||
        probe.getContext("experimental-webgl");
      if (gl) {
        renderer = new THREE.WebGLRenderer({
          canvas: webglCanvas,
          alpha: true,
          antialias: true,
        });
        mode = "webgl";
      }
    } catch {
      if (renderer) renderer.dispose();
      renderer = null;
    }
    if (mode === "2d") {
      webglCanvas.style.display = "none";
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 1;
    let h = 1;

    let scene: THREE.Scene | null = null;
    let camera: THREE.OrthographicCamera | null = null;
    let plane: THREE.Group | null = null;
    let propeller: THREE.Group | null = null;
    let materials: THREE.MeshStandardMaterial[] = [];
    let points: THREE.Points | null = null;
    let pointVels: Float32Array | null = null;
    let pointLife: Float32Array | null = null;

    if (mode === "webgl" && renderer) {
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(dpr);

      scene = new THREE.Scene();
      scene.add(new THREE.AmbientLight(0xffffff, 1.15));
      const key = new THREE.DirectionalLight(0xffffff, 1.4);
      key.position.set(2, 3, 6);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0x4de8ff, 0.5);
      rim.position.set(-3, -1, 5);
      scene.add(rim);

      camera = new THREE.OrthographicCamera(0, 1, 1, 0, -1000, 1000);

      const built = buildPlane();
      plane = built.group;
      propeller = built.propeller;
      materials = built.materials;
      plane.visible = false;
      scene.add(plane);

      const count = 160;
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      pointVels = new Float32Array(count * 3);
      pointLife = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        const mix = Math.random();
        if (mix < 0.45) {
          colors[i * 3] = 1;
          colors[i * 3 + 1] = 0.69;
          colors[i * 3 + 2] = 0.125;
        } else if (mix < 0.8) {
          colors[i * 3] = 1;
          colors[i * 3 + 1] = 0.5;
          colors[i * 3 + 2] = 0.2;
        } else {
          colors[i * 3] = 1;
          colors[i * 3 + 1] = 0.3;
          colors[i * 3 + 2] = 0.24;
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      const mat = new THREE.PointsMaterial({
        size: 5,
        vertexColors: true,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      points = new THREE.Points(geo, mat);
      points.visible = false;
      scene.add(points);
    }

    const setPlaneOpacity = (o: number) => {
      for (const m of materials) {
        m.transparent = true;
        m.opacity = o;
      }
    };
    setPlaneOpacity(1);

    const spawnExplosion = (x: number, y: number) => {
      if (!points || !pointVels || !pointLife) return;
      const pos = points.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pointLife.length; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.random() * 26;
        const v = 55 + Math.random() * 160;
        pos.setXYZ(
          i,
          x + Math.cos(a) * r,
          y + Math.sin(a) * r,
          (Math.random() - 0.5) * 8
        );
        pointVels[i * 3] = Math.cos(a) * v;
        pointVels[i * 3 + 1] = Math.sin(a) * v - 30;
        pointVels[i * 3 + 2] = (Math.random() - 0.5) * 30;
        pointLife[i] = 1;
      }
      pos.needsUpdate = true;
      points.visible = true;
      (points.material as THREE.PointsMaterial).opacity = 1;
    };

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      if (mode === "webgl" && renderer && camera) {
        renderer.setSize(w, h, false);
        camera.left = 0;
        camera.right = w;
        camera.top = h;
        camera.bottom = 0;
        camera.updateProjectionMatrix();
      } else {
        fallbackCanvas.width = Math.round(w * dpr);
        fallbackCanvas.height = Math.round(h * dpr);
      }
    };
    resize();

    let lastState: RoundState = "betting";
    let crashing = false;
    let crashT = 0;
    let crashPoint = { x: 0, y: 0, angle: 0 };
    let explosionActive = false;

    const ctx2d = fallbackCanvas.getContext("2d");

    let raf = 0;
    let prev = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min((now - prev) / 1000, 0.05);
      prev = now;
      const state = roundStateRef.current ?? "betting";
      const mult = multiplierRef.current ?? 1.0;

      if (state !== lastState) {
        if (state === "crashed") {
          crashing = true;
          crashT = 0;
          crashPoint = curvePoint(mult, w, h);
          explosionActive = true;
          spawnExplosion(crashPoint.x, crashPoint.y);
        } else {
          crashing = false;
          explosionActive = false;
          if (points) points.visible = false;
        }
        lastState = state;
      }

      if (mode === "2d" || !renderer || !scene || !camera || !plane || !propeller) {
        if (ctx2d) {
          ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx2d.clearRect(0, 0, w, h);
          if (state === "running") {
            const pt = curvePoint(mult, w, h);
            if (pt.growth > 0.012) {
              ctx2d.save();
              ctx2d.translate(pt.x, pt.y);
              ctx2d.rotate(pt.angle - Math.PI / 4);
              ctx2d.font = "16px system-ui";
              ctx2d.fillText("✈️", 0, 0);
              ctx2d.restore();
            }
          } else if (state === "crashed" && crashing) {
            ctx2d.save();
            ctx2d.translate(crashPoint.x, crashPoint.y);
            ctx2d.font = "26px system-ui";
            ctx2d.textAlign = "center";
            ctx2d.fillText("💥", 0, 0);
            ctx2d.restore();
          }
        }
        return;
      }

      if (state === "running") {
        const target = curvePoint(mult, w, h);
        plane.visible = true;
        setPlaneOpacity(1);
        const k = Math.min(1, dt * 8);
        plane.position.x += (target.x - plane.position.x) * k;
        plane.position.y += (target.y - plane.position.y) * k;
        plane.rotation.z = angleLerp(plane.rotation.z, target.angle, k);
        propeller.rotation.z += dt * 24;
      } else if (state === "crashed" && crashing) {
        crashT += dt;
        const diveStart = 0.12;
        if (crashT <= diveStart) {
          const target = curvePoint(mult, w, h);
          const k = Math.min(1, dt * 12);
          plane.position.x += (target.x - plane.position.x) * k;
          plane.position.y += (target.y - plane.position.y) * k;
        } else {
          const t = crashT - diveStart;
          const targetAngle = crashPoint.angle + Math.PI / 2;
          plane.rotation.z = angleLerp(plane.rotation.z, targetAngle, Math.min(1, dt * 6));
          const speed = 240 + 1100 * Math.min(t, 1);
          plane.position.x += Math.cos(plane.rotation.z) * speed * dt;
          plane.position.y += Math.sin(plane.rotation.z) * speed * dt;
          const fade = 1 - Math.min(1, t / 0.7);
          setPlaneOpacity(Math.max(fade, 0));
        }
        propeller.rotation.z += dt * 30;
        if (crashT > 2.2) plane.visible = false;
      } else {
        plane.visible = false;
        setPlaneOpacity(1);
      }

      if (points && pointVels && pointLife && explosionActive) {
        const pos = points.geometry.attributes.position as THREE.BufferAttribute;
        const mat = points.material as THREE.PointsMaterial;
        let alive = false;
        const life = dt / 1.4;
        for (let i = 0; i < pointLife.length; i++) {
          if (pointLife[i] <= 0) continue;
          pointLife[i] -= life;
          pos.setXYZ(
            i,
            pos.getX(i) + pointVels[i * 3] * dt,
            pos.getY(i) + pointVels[i * 3 + 1] * dt,
            pos.getZ(i) + pointVels[i * 3 + 2] * dt
          );
          pointVels[i * 3] *= 0.94;
          pointVels[i * 3 + 1] *= 0.94;
          pointVels[i * 3 + 2] *= 0.94;
          if (pointLife[i] > 0) alive = true;
        }
        pos.needsUpdate = true;
        mat.opacity = alive ? 1 : 0;
        points.visible = alive;
        explosionActive = alive;
      }

      renderer.render(scene, camera);
    };

    raf = requestAnimationFrame(loop);
    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (renderer && scene) {
        renderer.dispose();
        scene.traverse((obj) => {
          if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
            obj.geometry?.dispose();
            const m = obj.material;
            if (Array.isArray(m)) m.forEach((mm) => mm.dispose());
            else m?.dispose();
          }
        });
      }
    };
  }, [multiplierRef, roundStateRef]);

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <canvas ref={webglRef} className="absolute inset-0 h-full w-full" />
      <canvas ref={fallbackRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
