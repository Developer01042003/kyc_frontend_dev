import axios, { AxiosError } from 'axios';
import { SignupData, LoginData } from '../types/auth';

const API_URL = 'https://kyc-back-rmgs.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Error handler
const handleApiError = (error: AxiosError) => {
  if (error.response) {
    console.error('API Error Response:', {
      status: error.response.status,
      data: error.response.data,
      headers: error.response.headers
    });
    
    switch (error.response.status) {
      case 401:
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        window.location.href = '/login';
        break;
      case 403:
        console.error('Forbidden: You do not have permission');
        break;
      case 404:
        console.error('Not Found: The requested resource does not exist');
        break;
      case 500:
        console.error('Server Error: Please try again later');
        break;
    }
  } else if (error.request) {
    console.error('No response received:', error.request);
  } else {
    console.error('Error setting up request:', error.message);
  }
  
  throw error;
};

// Interceptor - Only add auth header for KYC endpoints
api.interceptors.request.use((config) => {
  // Only add authorization header for KYC endpoints
  if (config.url?.startsWith('/kyc/')) {
    const accessToken = localStorage.getItem('access');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
  }
  return config;
}, (error) => Promise.reject(error));

export const signup = async (data: SignupData) => {
  try {
    // Format the data according to the API expectations
    const formattedData = {
      username: data.username,
      email: data.email,
      password: data.password,
      full_name: data.full_name,
      whatsapp: data.whatsapp,
      gender: data.gender,
      address: data.address,
      country: data.country
    };
    
    const response = await api.post('/auth/signup/', formattedData);
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      // Log the specific error message from the server
      console.error('Signup Error:', error.response.data);
      throw new Error(JSON.stringify(error.response.data));
    }
    handleApiError(error as AxiosError);
    throw error;
  }
};

export const login = async (data: LoginData) => {
  try {
    const loginResponse = await api.post('/auth/login/', data);
    
    if (loginResponse.data.access) {
      localStorage.setItem('access', loginResponse.data.access);
      localStorage.setItem('refresh', loginResponse.data.refresh);
    }
    
    return loginResponse.data;
  } catch (error) {
    handleApiError(error as AxiosError);
    throw error;
  }
};

export const submitKYC = async (imageSrc: string) => {
  try {
    const fetchResponse = await fetch(imageSrc);
    const blob = await fetchResponse.blob();
    const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
    
    const formData = new FormData();
    formData.append('selfie', file);

    const kycResponse = await api.post('/kyc/kyc/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
    
    return {
      ...kycResponse.data,
      selfieUrl: kycResponse.data.selfie_url || imageSrc
    };
  } catch (error) {
    handleApiError(error as AxiosError);
    throw error;
  }
};

export default api;