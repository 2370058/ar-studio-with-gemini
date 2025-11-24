import React, { useRef } from 'react';
import { Camera, Box, Upload, X, Trash2, ArrowRight } from 'lucide-react';
import { UploadedModel } from '../types';

interface UIOverlayProps {
  isAR: boolean;
  onEnterAR: () => void;
  onCapture: () => void;
  onReset: () => void;
  onFileUpload: (file: File) => void;
  activeModel: UploadedModel | null;
  uploadedModels: UploadedModel[];
  onSelectModel: (model: UploadedModel) => void;
  status: string;
}

const UIOverlay: React.FC<UIOverlayProps> = ({
  isAR,
  onEnterAR,
  onCapture,
  onReset,
  onFileUpload,
  activeModel,
  uploadedModels,
  onSelectModel,
  status,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!isAR) {
    return (
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black text-white p-6">
        <div className="max-w-md w-full text-center space-y-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
              WebAR Studio
            </h1>
            <p className="text-gray-400">
              Place 3D models in the real world directly from your browser.
            </p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Supported Formats</h3>
            <div className="flex justify-center gap-4">
              <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm font-mono border border-blue-500/30">.OBJ</span>
              <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm font-mono border border-purple-500/30">.FBX</span>
            </div>
          </div>

          <button
            onClick={onEnterAR}
            className="w-full group relative flex items-center justify-center gap-3 bg-white text-black py-4 px-8 rounded-full font-bold text-lg hover:scale-105 transition-all duration-200 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
          >
            <Camera className="w-6 h-6" />
            <span>Launch AR Camera</span>
            <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity absolute right-6" />
          </button>
          
          <p className="text-xs text-gray-500 mt-4">
            Requires an AR-compatible device (Android Chrome or iOS with WebXR Viewer).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-4">
      {/* Top Bar */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="bg-black/40 backdrop-blur-md rounded-lg p-2 border border-white/10">
          <p className="text-xs text-white font-mono">{status}</p>
        </div>
        <button
          onClick={onReset}
          className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-200 rounded-full backdrop-blur-md transition-colors border border-red-500/30"
          title="Clear Scene"
        >
          <Trash2 size={20} />
        </button>
      </div>

      {/* Center Reticle Hint */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-50">
        <div className="w-8 h-8 border-2 border-white/30 rounded-full flex items-center justify-center">
          <div className="w-1 h-1 bg-white rounded-full"></div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="pointer-events-auto flex flex-col gap-4">
        
        {/* Model Selector Scroll */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar px-2">
          {/* Default Primitive */}
          <button
            onClick={() => onSelectModel({ name: 'Cube', url: '', type: 'primitive' })}
            className={`flex-shrink-0 w-14 h-14 rounded-xl border-2 flex items-center justify-center transition-all ${
              activeModel?.type === 'primitive' ? 'border-blue-400 bg-blue-500/30' : 'border-white/10 bg-black/40'
            }`}
          >
            <Box size={20} className="text-white" />
          </button>

          {/* Uploaded Models */}
          {uploadedModels.map((model, idx) => (
            <button
              key={idx}
              onClick={() => onSelectModel(model)}
              className={`flex-shrink-0 w-14 h-14 rounded-xl border-2 flex flex-col items-center justify-center transition-all overflow-hidden relative ${
                activeModel === model ? 'border-blue-400 bg-blue-500/30' : 'border-white/10 bg-black/40'
              }`}
            >
              <span className="text-[10px] text-white font-mono truncate w-full px-1 text-center">{model.name}</span>
              <span className="text-[8px] text-gray-300 uppercase">{model.type}</span>
            </button>
          ))}

          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 w-14 h-14 rounded-xl border-2 border-dashed border-white/30 bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <Upload size={20} className="text-gray-300" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".obj,.fbx"
            onChange={handleFileChange}
          />
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-center gap-6 pb-4">
           {/* Capture Button */}
           <button
            onClick={onCapture}
            className="w-16 h-16 rounded-full border-4 border-white bg-white/20 hover:bg-white/40 backdrop-blur-sm transition-all active:scale-95 flex items-center justify-center"
            aria-label="Take Photo"
          >
            <div className="w-12 h-12 bg-white rounded-full"></div>
          </button>
          
          <div className="absolute right-6 bottom-8 text-xs text-white/50 max-w-[100px] text-right pointer-events-none">
            Tap screen to place object
          </div>
        </div>
      </div>
    </div>
  );
};

export default UIOverlay;