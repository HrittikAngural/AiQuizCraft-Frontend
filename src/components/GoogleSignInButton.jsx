import React, { useContext, useEffect, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import './GoogleSignInButton.css';

const GoogleSignInButton = ({ onAuthenticated }) => {
  const { loginWithGoogle } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);
  const [buttonWidth, setButtonWidth] = useState(360);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    const updateButtonWidth = () => {
      setButtonWidth(Math.min(360, Math.max(200, window.innerWidth - 88)));
    };

    updateButtonWidth();
    window.addEventListener('resize', updateButtonWidth);
    return () => window.removeEventListener('resize', updateButtonWidth);
  }, []);

  const handleSuccess = async (credentialResponse) => {
    if (!credentialResponse.credential) {
      toast.error('Google did not return an ID token. Please try again.');
      return;
    }

    setIsLoading(true);
    try {
      const success = await loginWithGoogle(credentialResponse.credential);
      if (success) onAuthenticated();
    } finally {
      setIsLoading(false);
    }
  };

  if (!clientId) {
    return (
      <p className="google-auth-configuration" role="status">
        Google sign-in is not configured. Add <code>VITE_GOOGLE_CLIENT_ID</code> to the frontend environment.
      </p>
    );
  }

  return (
    <div className={`google-auth-button${isLoading ? ' google-auth-button-loading' : ''}`} aria-busy={isLoading}>
      {isLoading && (
        <span className="google-auth-loading" role="status">
          <span className="google-auth-spinner" aria-hidden="true" />
          Verifying your Google account…
        </span>
      )}
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => toast.error('Google sign-in was cancelled or could not be completed.')}
        theme="outline"
        size="large"
        text="continue_with"
        shape="rectangular"
        logo_alignment="left"
        width={buttonWidth}
      />
    </div>
  );
};

export default GoogleSignInButton;
