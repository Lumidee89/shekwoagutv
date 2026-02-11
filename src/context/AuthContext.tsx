import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axios';
import { User, LoginCredentials, RegisterCredentials, AuthResponse } from '../types';
import { Alert } from 'react-native';

interface AuthContextData {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      setError(null);
      const storedUser = await AsyncStorage.getItem('user');
      const storedToken = await AsyncStorage.getItem('token');

      if (storedUser && storedToken) {
        // Verify token is still valid by making a test request
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          // Optional: Verify token with backend
          // const response = await api.get('/auth/verify');
          setUser(JSON.parse(storedUser));
        } catch (error) {
          // Token invalid, clear storage
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('user');
          delete api.defaults.headers.common['Authorization'];
        }
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      setError(null);
      setLoading(true);
      
      console.log('Attempting login with:', credentials.email);
      console.log('API Base URL:', api.defaults.baseURL);
      
      const response = await api.post<AuthResponse>('/auth/login', credentials);
      
      console.log('Login response:', response.data);
      
      const { token, data } = response.data;
      
      if (!token || !data?.user) {
        throw new Error('Invalid response from server');
      }
      
      // Store user data and token
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      
      // Set default authorization header
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Update state
      setUser(data.user);
      
      console.log('Login successful for user:', data.user.username);
      
    } catch (error: any) {
      console.error('Login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config,
      });
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.response) {
        // Server responded with error
        errorMessage = error.response.data?.message || 
                      error.response.data?.error || 
                      `Server error: ${error.response.status}`;
      } else if (error.request) {
        // No response received
        errorMessage = 'Cannot connect to server. Please check your internet connection.';
      } else {
        // Request setup error
        errorMessage = error.message || 'Network error. Please try again.';
      }
      
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    try {
      setError(null);
      setLoading(true);
      
      console.log('Attempting registration for:', credentials.email);
      
      const response = await api.post<AuthResponse>('/auth/register', credentials);
      
      console.log('Registration response:', response.data);
      
      const { token, data } = response.data;
      
      if (!token || !data?.user) {
        throw new Error('Invalid response from server');
      }
      
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(data.user);
      
      console.log('Registration successful for user:', data.user.username);
      
    } catch (error: any) {
      console.error('Registration error:', error.response?.data || error.message);
      
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.response) {
        errorMessage = error.response.data?.message || 
                      error.response.data?.error || 
                      'Registration failed';
      } else if (error.request) {
        errorMessage = 'Cannot connect to server. Please check your internet connection.';
      } else {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      setError(null);
    } catch (error) {
      console.error('Error during logout:', error);
      setError('Failed to logout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};