import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import FaceTracker from '../components/FaceTracker';
import KYCStatus from '../components/KYCStatus';

const Dashboard = () => {
  const [kycStep, setKycStep] = useState<'initial' | 'verification' | 'submitted'>('initial');

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>
        
        {kycStep === 'initial' && (
          <div className="text-center">
            <button
              onClick={() => setKycStep('verification')}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Start KYC Verification
            </button>
          </div>
        )}

        {kycStep === 'verification' && <FaceTracker />}
        {kycStep === 'submitted' && <KYCStatus />}
      </div>
    </div>
  );
};

export default Dashboard;