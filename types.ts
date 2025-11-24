import { Vector3 } from 'three';

export type FileType = 'obj' | 'fbx' | 'primitive';

export interface PlacedObject {
  id: string;
  type: FileType;
  url?: string;
  position: Vector3;
  rotation: number;
  scale: number;
  name: string;
}

export interface UploadedModel {
  name: string;
  url: string;
  type: FileType;
}

export type SceneMode = 'placement' | 'view';
