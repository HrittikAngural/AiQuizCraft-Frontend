import React, { createContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../utils/api';

export const AuthContext = createContext();

const USER_STORAGE_KEY = 'quizcraft-user';

const readSavedUser = () => {
  try {
    if (!localStorage.getItem('token')) return null;

    const savedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (!savedUser) return null;

    const parsedUser = JSON.parse(savedUser);
    return parsedUser && typeof parsedUser === 'object' ? parsedUser : null;
  } catch (error) {
    console.error('Could not restore the saved user profile:', error);
    return null;
  }
};

const persistUser = (user) => {
  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readSavedUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const checkUserLoggedIn = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          const { data } = await api.get('/api/auth/profile');
          
          setUser(data.user);
          persistUser(data.user);
        }
      } catch (error) {
        const status = error.response?.status;
        if (status === 401 || status === 403 || status === 404) {
          localStorage.removeItem('token');
          delete api.defaults.headers.common['Authorization'];
          persistUser(null);
          setUser(null);
        } else {
          const cachedUser = localStorage.getItem(USER_STORAGE_KEY);
          if (cachedUser) {
            try {
              setUser(JSON.parse(cachedUser));
            } catch (storageError) {
              console.error('Could not restore the saved user profile:', storageError);
              persistUser(null);
            }
          } else {
            console.error('Could not verify the saved login:', error);
          }
        }
      }
      
      setLoading(false);
    };
    
    checkUserLoggedIn();
  }, []);

  // Register user
  const register = async (userData) => {
    try {
      setLoading(true);
      
      const { data } = await api.post('/api/auth/register', userData);
      
      localStorage.setItem('token', data.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      
      setUser(data.user);
      persistUser(data.user);
      toast.success('Registration successful!');
      
      return true;
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (userData) => {
    try {
      setLoading(true);
      
      const { data } = await api.post('/api/auth/login', userData);
      
      localStorage.setItem('token', data.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      
      setUser(data.user);
      persistUser(data.user);
      toast.success('Login successful!');
      
      return true;
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (idToken) => {
    try {
      const { data } = await api.post('/api/auth/google', { idToken });

      localStorage.setItem('token', data.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      setUser(data.user);
      persistUser(data.user);
      toast.success('Signed in with Google successfully!');
      return true;
    } catch (error) {
      const message = error.response?.data?.message || 'Google sign-in failed. Please try again.';
      toast.error(message);
      return false;
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    const userId = user?.id || user?._id;
    if (userId) {
      sessionStorage.removeItem(`quizcraft-dashboard-${userId}`);
    }
    persistUser(null);
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        register,
        login,
        loginWithGoogle,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};