export interface User {
  _id: string;
  username: string;
  email: string;
  isAdmin?: boolean;
}

export interface AuthResponse {
  status: string;
  token: string;
  data: {
    user: User;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

export interface OnboardingItem {
  id: string;
  title: string;
  description: string;
  image: any; // Using any for require images
}