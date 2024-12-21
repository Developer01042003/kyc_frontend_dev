import React, { useRef, useEffect, useState } from 'react';
import { Camera } from 'lucide-react';
import { FaceMesh } from '@mediapipe/face_mesh';
import { detectBlink, detectHeadMovement } from '../utils/face-detection';
import { DetectionStep, LivenessState } from '../types/face-tracking';
import { submitKYC } from '../services/api';
import LivenessPrompt from './LivenessPrompt';
import { toast } from 'react-hot-toast';

const FaceTracker: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faceMeshRef = useRef<FaceMesh | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [currentStep, setCurrentStep] = useState<DetectionStep>('initial');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [livenessState, setLivenessState] = useState<LivenessState>({
    blinkDetected: false,
    headLeft: false,
    headRight: false,
    headUp: false,
    headDown: false,
  });

  const setupCamera = async () => {
    try {
      // First try to get the front camera
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      const frontCamera = videoDevices.find(device => 
        device.label.toLowerCase().includes('front') || 
        device.label.toLowerCase().includes('facetime')
      );

      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
          deviceId: frontCamera ? { exact: frontCamera.deviceId } : undefined
        }
      };

      streamRef.current = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          initializeFaceMesh();
        };
      }
    } catch (error) {
      console.error('Camera access error:', error);
      setCameraError('Failed to access camera. Please ensure camera permissions are granted.');
      toast.error('Camera access failed. Please check permissions.');
    }
  };

  useEffect(() => {
    setupCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (faceMeshRef.current) {
        faceMeshRef.current.close();
      }
    };
  }, []);

  const initializeFaceMesh = () => {
    faceMeshRef.current = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    });

    faceMeshRef.current.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    faceMeshRef.current.onResults(onResults);

    const sendToFaceMesh = async () => {
      if (videoRef.current && faceMeshRef.current) {
        await faceMeshRef.current.send({ image: videoRef.current });
        if (currentStep !== 'complete') {
          requestAnimationFrame(sendToFaceMesh);
        }
      }
    };

    sendToFaceMesh();
  };

  const onResults = (results: any) => {
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      return;
    }

    const landmarks = results.multiFaceLandmarks[0];
    
    // Draw face mesh on canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 1;
        
        // Draw face mesh points
        results.multiFaceLandmarks[0].forEach((landmark: any) => {
          ctx.beginPath();
          ctx.arc(
            landmark.x * canvasRef.current!.width,
            landmark.y * canvasRef.current!.height,
            1,
            0,
            2 * Math.PI
          );
          ctx.stroke();
        });
      }
    }

    if (currentStep === 'initial') {
      setCurrentStep('blink');
      return;
    }

    // Process face movements
    processMovements(landmarks);
  };

  const processMovements = (landmarks: any) => {
    if (currentStep === 'blink' && !livenessState.blinkDetected) {
      const blinked = detectBlink(landmarks);
      if (blinked) {
        setLivenessState(prev => ({ ...prev, blinkDetected: true }));
        setCurrentStep('lookLeft');
        toast.success('Blink detected!');
      }
      return;
    }

    const headMovement = detectHeadMovement(landmarks);
    if (headMovement.moved) {
      switch (currentStep) {
        case 'lookLeft':
          if (headMovement.direction === 'left' && !livenessState.headLeft) {
            setLivenessState(prev => ({ ...prev, headLeft: true }));
            setCurrentStep('lookRight');
            toast.success('Left turn detected!');
          }
          break;
        case 'lookRight':
          if (headMovement.direction === 'right' && !livenessState.headRight) {
            setLivenessState(prev => ({ ...prev, headRight: true }));
            setCurrentStep('lookUp');
            toast.success('Right turn detected!');
          }
          break;
        case 'lookUp':
          if (headMovement.direction === 'up' && !livenessState.headUp) {
            setLivenessState(prev => ({ ...prev, headUp: true }));
            handleKYCSubmission();
            toast.success('Up movement detected!');
          }
          break;
      }
    }
  };

  const captureImage = (): string | null => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        return canvas.toDataURL('image/jpeg', 0.8);
      }
    }
    return null;
  };

  const handleKYCSubmission = async () => {
    const imageSrc = captureImage();
    if (!imageSrc) {
      toast.error('Failed to capture image');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitKYC(imageSrc);
      toast.success('KYC submitted successfully!');
      setCurrentStep('complete');
    } catch (error) {
      toast.error('Failed to submit KYC');
      console.error('KYC submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cameraError) {
    return (
      <div className="text-center p-8 bg-red-50 rounded-lg">
        <Camera className="mx-auto text-red-500 w-12 h-12 mb-4" />
        <h3 className="text-lg font-semibold text-red-700 mb-2">Camera Access Error</h3>
        <p className="text-red-600">{cameraError}</p>
        <button 
          onClick={() => {
            setCameraError(null);
            setupCamera();
          }}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry Camera Access
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="aspect-video relative rounded-lg overflow-hidden shadow-lg">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full"
          width={1280}
          height={720}
        />
      </div>
      <LivenessPrompt
        currentStep={currentStep}
        livenessState={livenessState}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default FaceTracker;