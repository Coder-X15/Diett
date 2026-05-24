import React, { useState } from 'react';
import './AuthPage.css';
import { useAuth } from '../context/AuthContext';

function AuthPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signup, signin, loading } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isSignup) {
        await signup(email, password);
      } else {
        await signin(email, password);
      }
    } catch (err) {
      console.error('Authentication error:', err);
      alert('Authentication failed: ' + err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Diet Planner</h1>
        <h2>{isSignup ? 'Create Account' : 'Sign In'}</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="submit-btn"
          >
            {loading ? 'Loading...' : isSignup ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="toggle-auth">
          <p>
            {isSignup ? 'Already have an account?' : "Don't have an account?"}
            <button
              type="button"
              onClick={() => setIsSignup(!isSignup)}
              className="toggle-btn"
            >
              {isSignup ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
