import axios from 'axios';
import { LivenessResult } from '../types/face-tracking';

const API_URL = 'https://api.example.com/kyc'; // Replace with your API endpoint

export const submitKYCVerification = async (
  imageData: string,
  sessionId: string
): Promise<LivenessResult> => {
  try {
    const response = await axios.post(`${API_URL}/verify`, {
      image: imageData,
      sessionId,
      timestamp: new Date().toISOString(),
    });

    return response.data;
  } catch (error) {
    throw new Error('Failed to submit KYC verification');
  }
};