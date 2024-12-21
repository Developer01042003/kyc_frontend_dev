import React from 'react';
import { DetectionStep, LivenessState } from '../types/face-tracking';
import { Loader } from 'lucide-react';

interface LivenessPromptProps {
  currentStep: DetectionStep;
  livenessState: LivenessState;
  isSubmitting: boolean;
}

const LivenessPrompt: React.FC<LivenessPromptProps> = ({
  currentStep,
  livenessState,
  isSubmitting
}) => {
  const getPromptMessage = (): string => {
    if (isSubmitting) return 'Submitting KYC verification...';
    
    switch (currentStep) {
      case 'initial':
        return 'Position your face in the frame';
      case 'blink':
        return 'Please blink naturally';
      case 'lookLeft':
        return 'Turn your head to the left';
      case 'lookRight':
        return 'Turn your head to the right';
      case 'lookUp':
        return 'Look up slightly';
      case 'lookDown':
        return 'Look down slightly';
      case 'complete':
        return 'Liveness check complete!';
      default:
        return '';
    }
  };

  return (
    <div className="mt-4 p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
        Liveness Check
        {isSubmitting && <Loader className="animate-spin" />}
      </h3>
      <p className="text-gray-600 mb-4">{getPromptMessage()}</p>
      
      <div className="space-y-2">
        <div className="flex items-center">
          <span className={`w-4 h-4 rounded-full mr-2 ${
            livenessState.blinkDetected ? 'bg-green-500' : 'bg-gray-300'
          }`} />
          <span>Blink Detection</span>
        </div>
        <div className="flex items-center">
          <span className={`w-4 h-4 rounded-full mr-2 ${
            livenessState.headLeft ? 'bg-green-500' : 'bg-gray-300'
          }`} />
          <span>Head Turn Left</span>
        </div>
        <div className="flex items-center">
          <span className={`w-4 h-4 rounded-full mr-2 ${
            livenessState.headRight ? 'bg-green-500' : 'bg-gray-300'
          }`} />
          <span>Head Turn Right</span>
        </div>
        <div className="flex items-center">
          <span className={`w-4 h-4 rounded-full mr-2 ${
            livenessState.headUp ? 'bg-green-500' : 'bg-gray-300'
          }`} />
          <span>Look Up</span>
        </div>
      </div>
    </div>
  );
};

export default LivenessPrompt;