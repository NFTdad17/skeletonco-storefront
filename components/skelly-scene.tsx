"use client";

import { useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useLayoutEffect, useMemo, useRef } from "react";
import { Box3, Vector3, type Group } from "three";
import modelUrl from "@/art/Meshy_AI_skeleton_co_mascot_3d_1014202439_image-to-3d-texture.glb";

function Mascot() {
  const group = useRef<Group>(null);
  const { scene } = useGLTF(modelUrl);
  const model = useMemo(() => scene.clone(true), [scene]);

  useLayoutEffect(() => {
    const box = new Box3().setFromObject(model);
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());
    model.position.sub(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    model.scale.setScalar(1.25 / maxDim);
  }, [model]);

  useFrame((_, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.28;
  });

  return (
    <group ref={group}>
      <primitive object={model} />
    </group>
  );
}

export default function SkellyScene() {
  return (
    <Canvas
      camera={{ position: [0, 0.02, 4.4], fov: 28 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
    >
      <ambientLight intensity={1.2} />
      <directionalLight position={[1.6, 2.4, 2]} intensity={0.9} />
      <Suspense fallback={null}>
        <Mascot />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(modelUrl);
