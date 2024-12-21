import { FaceMeshLandmarks } from '../types/face-tracking';

// Constants for facial landmark indices
const LEFT_EYE_INDICES = [362, 385, 387, 263, 373, 380];
const RIGHT_EYE_INDICES = [33, 160, 158, 133, 153, 144];
const NOSE_TIP_INDEX = 1;
const HEAD_TOP_INDEX = 10;

// Adjusted threshold values for better detection
const BLINK_THRESHOLD = 0.025;
const HEAD_MOVEMENT_THRESHOLD = 0.1;

export const detectBlink = (landmarks: FaceMeshLandmarks[]): boolean => {
  const leftEyeOpenness = calculateEyeOpenness(landmarks, LEFT_EYE_INDICES);
  const rightEyeOpenness = calculateEyeOpenness(landmarks, RIGHT_EYE_INDICES);
  
  return leftEyeOpenness < BLINK_THRESHOLD || rightEyeOpenness < BLINK_THRESHOLD;
};

export const detectHeadMovement = (
  landmarks: FaceMeshLandmarks[]
): { direction: string; moved: boolean } => {
  const noseTip = landmarks[NOSE_TIP_INDEX];
  const headTop = landmarks[HEAD_TOP_INDEX];
  
  const xDiff = noseTip.x - headTop.x;
  const yDiff = noseTip.y - headTop.y;

  if (Math.abs(xDiff) > HEAD_MOVEMENT_THRESHOLD) {
    return {
      direction: xDiff > 0 ? 'right' : 'left',
      moved: true
    };
  }

  if (Math.abs(yDiff) > HEAD_MOVEMENT_THRESHOLD) {
    return {
      direction: yDiff > 0 ? 'down' : 'up',
      moved: true
    };
  }

  return { direction: 'center', moved: false };
};

const calculateEyeOpenness = (
  landmarks: FaceMeshLandmarks[],
  indices: number[]
): number => {
  const upperY = Math.max(
    landmarks[indices[1]].y,
    landmarks[indices[2]].y
  );
  const lowerY = Math.min(
    landmarks[indices[4]].y,
    landmarks[indices[5]].y
  );
  
  return Math.abs(upperY - lowerY);
};