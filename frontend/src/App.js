import React, { useState } from 'react';
import './App.css';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const API_URL = 'http://localhost:8080';

  const handleSignup = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          data: {},
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to sign up');
      }


      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to sign in');
      }

      const data = await response.json();
      setUser(data);
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Signup error:', error);
      alert('Signup failed: ' + error.message);
    }
  };

  const handleSignin = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });
      const data = await response.json();
      setUser(data);
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Signin error:', error);
      alert('Signin failed: ' + error.message);
    }
  };

  const handleSignout = async () => {
    try {
      await fetch(`${API_URL}/signout`, {
        method: 'POST',
      });
      setUser(null);
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Signout error:', error);
    }
  };

  return (
    <div className="App">
      {isLoggedIn ? (
        <Dashboard
          user={user}
          onSignout={handleSignout}
          apiUrl={API_URL}
        />
      ) : (
        <AuthPage onSignup={handleSignup} onSignin={handleSignin} />
      )}
    </div>
  );
}

export default App;
