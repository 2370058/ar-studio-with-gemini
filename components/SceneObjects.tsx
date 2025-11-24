import React, { useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { PlacedObject } from '../types';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface SceneObjectProps {
  object: PlacedObject;
}

// Helper to load OBJ
const ObjModel = ({ url, ...props }: { url: string; [key: string]: any }) => {
  const obj = useLoader(OBJLoader, url);
  const cloned = useMemo(() => obj.clone(), [obj]);
  return <primitive object={cloned} {...props} />;
};

// Helper to load FBX
const FbxModel = ({ url, ...props }: { url: string; [key: string]: any }) => {
  const fbx = useLoader(FBXLoader, url);
  const cloned = useMemo(() => fbx.clone(), [fbx]);
  // FBX often comes in with different scales/rotations, normalizing helps
  return <primitive object={cloned} scale={0.01} {...props} />;
};

export const SceneObject: React.FC<SceneObjectProps> = ({ object }) => {
  const { position, rotation, scale, type, url, name } = object;

  const commonProps = {
    position: position,
    rotation: [0, rotation, 0] as [number, number, number],
    scale: [scale, scale, scale] as [number, number, number],
    onClick: (e: any) => {
      e.stopPropagation();
      console.log(`Clicked on ${name}`);
    }
  };

  if (type === 'primitive') {
    return (
      <mesh {...commonProps}>
        <boxGeometry args={[0.2, 0.2, 0.2]} />
        <meshStandardMaterial color={new THREE.Color().setHSL(Math.random(), 1, 0.5)} />
      </mesh>
    );
  }

  if (type === 'obj' && url) {
    return (
      <React.Suspense fallback={<LoaderPlaceholder position={position} />}>
        <ObjModel url={url} {...commonProps} />
      </React.Suspense>
    );
  }

  if (type === 'fbx' && url) {
    return (
      <React.Suspense fallback={<LoaderPlaceholder position={position} />}>
        <FbxModel url={url} {...commonProps} />
      </React.Suspense>
    );
  }

  return null;
};

const LoaderPlaceholder = ({ position }: { position: THREE.Vector3 }) => (
  <Html position={position} center>
    <div className="text-white text-xs bg-black/50 px-2 py-1 rounded">Loading...</div>
  </Html>
);