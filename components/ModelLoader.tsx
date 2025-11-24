import React, { useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import * as THREE from 'three';
import { ModelType } from '../types';

interface ModelLoaderProps {
  url: string;
  type: ModelType;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  onClick?: () => void;
}

export const ModelLoader: React.FC<ModelLoaderProps> = ({ 
  url, 
  type, 
  position = [0, 0, 0], 
  rotation = [0, 0, 0], 
  scale = [1, 1, 1],
  onClick 
}) => {
  // Use useMemo to avoid re-creating the loader logic on every render
  const object = useLoader(
    type === ModelType.FBX ? FBXLoader : OBJLoader,
    url
  ) as THREE.Group;

  const clone = useMemo(() => {
    // Clone the object so we can place multiple instances of the same model
    // Safely handle scene property for GLTF/FBX vs direct Group for OBJ
    // Cast to any to avoid TypeScript inference issues (property 'clone' does not exist on type 'never')
    const obj = object as any;
    const scene = obj.scene ? obj.scene.clone() : obj.clone();
    
    // Normalize size (simple heuristic to keep objects viewable in AR)
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const targetScale = 0.5; // Target 0.5 meters roughly
    
    if (maxDim > 0) {
        const s = targetScale / maxDim;
        scene.scale.set(s, s, s);
    }
    
    // Auto-center geometry
    scene.traverse((child: any) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            // Provide a default material if OBJ lacks MTL
            if (!child.material) {
               child.material = new THREE.MeshStandardMaterial({ color: 'white' });
            }
        }
    });
    
    return scene;
  }, [object]);

  return (
    <primitive 
      object={clone} 
      position={position} 
      rotation={rotation} 
      scale={scale} 
      onClick={onClick}
    />
  );
};