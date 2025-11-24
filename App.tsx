import React, { useState, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { XR, createXRStore } from '@react-three/xr';
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
  const [placedObjects, setPlacedObjects] = useState<PlacedObject[]>([]);
  const [uploadedModels, setUploadedModels] = useState<UploadedModel[]>([]);
  const [activeModel, setActiveModel] = useState<UploadedModel>({ name: 'Cube', url: '', type: 'primitive' });
  const [status, setStatus] = useState('Detecting floor...');

  // Sync isAR state with XR store session
  useEffect(() => {
    const unsub = store.subscribe((state) => {
      setIsAR(!!state.session);
    });
    return () => unsub();
  }, []);

  // Handler for entering AR
  const handleEnterAR = useCallback(async () => {
    // Check if WebXR is supported
    if (!navigator.xr) {
      setStatus("WebXR not supported on this device");
      return;
    }

    // Config: 
    // - local-floor: Standard for AR.
    // - dom-overlay: Required for UI buttons to be visible on mobile.
    // - hit-test: Optional to prevent session rejection on devices with partial support.
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
      setStatus("AR Error: " + (e.message || "Config not supported"));
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

  // Handler for placing objects in AR
  const handlePlaceObject = useCallback((position: Vector3) => {
    const newObject: PlacedObject = {
      id: uuidv4(),
      type: activeModel.type,
      url: activeModel.url,
      position: position,
      rotation: Math.random() * Math.PI * 2, // Random rotation for variety
      scale: 1, // Default scale, could be adjustable
      name: activeModel.name
    };

    setPlacedObjects((prev) => [...prev, newObject]);
  }, [activeModel]);

  // Capture functionality
  const handleCapture = useCallback(() => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      // In WebXR, sometimes the camera feed isn't in the canvas due to privacy.
      // We try to grab the WebGL context.
      try {
        const dataURL = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `ar-capture-${Date.now()}.png`;
        link.href = dataURL;
        link.click();
        setStatus('Photo saved!');
        setTimeout(() => setStatus('Scanning...'), 2000);
      } catch (e) {
        console.error(e);
        setStatus('Capture failed. Use system screenshot.');
      }
    }
  }, []);

  const resetScene = () => {
    setPlacedObjects([]);
    setStatus('Scene cleared');
    setTimeout(() => setStatus('Scanning...'), 2000);
  };

  return (
    <>
      {/* Non-AR HTML Overlay */}
      <UIOverlay
        isAR={isAR}
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
          
          {/* The Reticle handles the Hit Test logic inside the XR session */}
          {isAR && (
             <Reticle 
               active={isAR} 
               onPlace={handlePlaceObject} 
             />
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