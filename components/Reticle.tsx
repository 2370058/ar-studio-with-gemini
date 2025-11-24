import React, { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Mesh } from 'three';

interface ReticleProps {
  onPlace: (position: any) => void;
  active: boolean;
}

const Reticle: React.FC<ReticleProps> = ({ onPlace, active }) => {
  const reticleRef = useRef<Mesh>(null);
  const { gl } = useThree();
  const hitTestSource = useRef<any>(null);
  const hitTestSourceRequested = useRef(false);

  // Clean up hit test source when component unmounts or session ends
  useEffect(() => {
    return () => {
      hitTestSourceRequested.current = false;
      hitTestSource.current = null;
    };
  }, []);

  useFrame((state, delta, frame) => {
    if (!active || !frame) return;

    const session = gl.xr.getSession();
    if (!session) {
        if (reticleRef.current) reticleRef.current.visible = false;
        return;
    }

    // Request hit test source once
    if (!hitTestSourceRequested.current) {
      session.requestReferenceSpace('viewer')
        .then((referenceSpace) => {
            if (!session.requestHitTestSource) {
                // If hit test not supported (e.g. 3DoF or configured without it), stop trying.
                console.warn("Hit test not supported on this session");
                hitTestSourceRequested.current = true; 
                return;
            }
            session.requestHitTestSource({ space: referenceSpace })
            .then((source) => {
                hitTestSource.current = source;
            })
            .catch((err) => {
                console.error("Failed to request hit test source", err);
                // Do not retry endlessly
                hitTestSourceRequested.current = true;
            });
      })
      .catch((err) => {
         console.error("Failed to request reference space", err);
         hitTestSourceRequested.current = true;
      });
      hitTestSourceRequested.current = true;
    }

    if (hitTestSource.current) {
      const referenceSpace = gl.xr.getReferenceSpace();
      if (referenceSpace) {
        const hitTestResults = frame.getHitTestResults(hitTestSource.current);
        if (hitTestResults.length > 0) {
          const hit = hitTestResults[0];
          const pose = hit.getPose(referenceSpace);

          if (pose && reticleRef.current) {
            reticleRef.current.visible = true;
            reticleRef.current.matrix.fromArray(pose.transform.matrix);
            // Decompose matrix to update standard Three.js properties for rendering
            reticleRef.current.matrix.decompose(
                reticleRef.current.position,
                reticleRef.current.quaternion,
                reticleRef.current.scale
            );
          }
        } else if (reticleRef.current) {
          reticleRef.current.visible = false;
        }
      }
    }
  });

  return (
    <mesh
      ref={reticleRef}
      rotation={[-Math.PI / 2, 0, 0]}
      visible={false}
      onClick={(e) => {
        e.stopPropagation();
        if (reticleRef.current?.visible) {
          onPlace(reticleRef.current.position.clone());
        }
      }}
    >
      <ringGeometry args={[0.1, 0.15, 32]} />
      <meshBasicMaterial color="white" />
    </mesh>
  );
};

export default Reticle;