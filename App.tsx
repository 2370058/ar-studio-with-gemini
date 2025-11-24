import React, { useState, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { XR, createXRStore } from '@react-three/xr';
import { OrbitControls, Plane } from '@react-three/drei';
import { Vector3 } from 'three';
import { v4 as uuidv4 } from 'uuid';

import Reticle from './components/Reticle';
import { SceneObject } from './components/SceneObjects';
import UIOverlay from './components/UIOverlay';
import { PlacedObject, UploadedModel, FileType } from './types';

// Initialize XR store without default config.
// Configuration will be passed at runtime in enterAR.
const store = createXRStore();

function App() {
  const [isAR, setIsAR] = useState(false);
  const [isSimulation, setIsSimulation] = useState(false);
  const [placedObjects, setPlacedObjects] = useState<PlacedObject[]>([]);
  const [uploadedModels, setUploadedModels] = useState<UploadedModel[]>([]);
  const [activeModel, setActiveModel] = useState<UploadedModel>({ name: 'Cube', url: '', type: 'primitive' });
  const [status, setStatus] = useState('Detecting floor...');

  // Sync isAR state with XR store session
  useEffect(() => {
    const unsub = store.subscribe((state) => {
      setIsAR(!!state.session);
      // If session ends, we might want to stay in app or go back to menu. 
      // For now, if AR ends and we weren't in sim, it goes back to menu (isAR=false, isSimulation=false).
    });
    return () => unsub();
  }, []);

  // Handler for entering AR or Simulation
  const handleEnterAR = useCallback(async () => {
    // Check if WebXR is supported
    const isXRSupported = navigator.xr && await navigator.xr.isSessionSupported('immersive-ar');
    
    if (!isXRSupported) {
      // Fallback to simulation mode for PC/non-supported devices
      setIsSimulation(true);
      setStatus("3D Simulation Mode");
      return;
    }

    // Config for AR
    const sessionInit = {
      requiredFeatures: ['local-floor', 'dom-overlay'],
      optionalFeatures: ['hit-test'],
      domOverlay: { root: document.body }
    };

    try {
      // Cast to any to avoid TS argument count errors while passing valid WebXR config
      await (store.enterAR as any)('immersive-ar', sessionInit);
    } catch (e: any) {
      console.error("Failed to start AR session:", e);
      // Fallback to simulation if AR launch fails (e.g. user denied permission)
      setIsSimulation(true);
      setStatus("AR Failed - Switched to Simulation");
    }
  }, []);

  // Handler for file uploads (.obj / .fbx)
  const handleFileUpload = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    let type: FileType = 'primitive';
    if (extension === 'obj') type = 'obj';
    if (extension === 'fbx') type = 'fbx';

    const newModel: UploadedModel = {
      name: file.name.slice(0, 8), // Shorten name for UI
      url,
      type
    };

    setUploadedModels((prev) => [...prev, newModel]);
    setActiveModel(newModel);
  }, []);

  // Handler for placing objects
  const handlePlaceObject = useCallback((position: Vector3) => {
    const newObject: PlacedObject = {
      id: uuidv4(),
      type: activeModel.type,
      url: activeModel.url,
      position: position,
      rotation: Math.random() * Math.PI * 2, // Random rotation for variety
      scale: 1, // Default scale
      name: activeModel.name
    };

    setPlacedObjects((prev) => [...prev, newObject]);
  }, [activeModel]);

  // Capture functionality
  const handleCapture = useCallback(() => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      try {
        const dataURL = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `ar-capture-${Date.now()}.png`;
        link.href = dataURL;
        link.click();
        setStatus('Photo saved!');
        setTimeout(() => setStatus(isSimulation ? '3D Simulation Mode' : 'Scanning...'), 2000);
      } catch (e) {
        console.error(e);
        setStatus('Capture failed.');
      }
    }
  }, [isSimulation]);

  const resetScene = () => {
    setPlacedObjects([]);
    setStatus('Scene cleared');
    setTimeout(() => setStatus(isSimulation ? '3D Simulation Mode' : 'Scanning...'), 2000);
  };
  
  // Determine if we are in a "playing" state (AR or Sim)
  const isPlaying = isAR || isSimulation;

  return (
    <>
      <UIOverlay
        isPlaying={isPlaying}
        onEnterAR={handleEnterAR}
        onCapture={handleCapture}
        onReset={resetScene}
        onFileUpload={handleFileUpload}
        activeModel={activeModel}
        uploadedModels={uploadedModels}
        onSelectModel={setActiveModel}
        status={status}
      />

      <Canvas>
        <XR store={store}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
          
          {/* AR Mode: Reticle handles hit test */}
          {isAR && (
             <Reticle 
               active={isAR} 
               onPlace={handlePlaceObject} 
             />
          )}

          {/* Simulation Mode: OrbitControls and Grid */}
          {isSimulation && (
            <>
              <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2 - 0.1} />
              <gridHelper args={[20, 20, 0x666666, 0x444444]} />
              {/* Invisible plane to catch clicks for placement */}
              <Plane 
                args={[100, 100]} 
                rotation={[-Math.PI / 2, 0, 0]} 
                visible={false}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlaceObject(e.point);
                }}
              />
            </>
          )}

          {/* Render all placed objects */}
          {placedObjects.map((obj) => (
            <SceneObject key={obj.id} object={obj} />
          ))}
        </XR>
      </Canvas>
    </>
  );
}

export default App;