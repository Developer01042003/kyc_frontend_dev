export interface SignupData {
  username: string;
  email: string;
  password: string;
  full_name: string;
  whatsapp: string;
  gender: string;
  address: string;
  country: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: {
    id: string;
    email: string;
    username: string;
  };
}