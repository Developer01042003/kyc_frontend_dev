// Types for face tracking and liveness detection
export type FaceMeshLandmarks = {
  x: number;
  y: number;
  z: number;
};

export type LivenessState = {
  blinkDetected: boolean;
  headLeft: boolean;
  headRight: boolean;
  headUp: boolean;
  headDown: boolean;
};

export type DetectionStep = 
  | 'initial'
  | 'blink'
  | 'lookLeft'
  | 'lookRight'
  | 'lookUp'
  | 'lookDown'
  | 'complete';

export interface LivenessResult {
  isLive: boolean;
  capturedImage?: string;
  sessionId: string;
}