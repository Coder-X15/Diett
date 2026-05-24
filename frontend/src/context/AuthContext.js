import React, { createContext, useContext, useState } from 'react';

// Create the context
const AuthContext = createContext(null);

// Custom hook to easily use the auth context
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    // Initialize user from localStorage so they stay logged in across reloads
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('dietplanner_user');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Grab API URL from environment variables, fallback to local development URL
    const apiUrl = process.env.REACT_APP_API_URL;

    const signup = async (email, password, data = {}) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${apiUrl}/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, data })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to sign up');
            }

            const userData = await response.json();
            setUser(userData);
            localStorage.setItem('dietplanner_user', JSON.stringify(userData));
            return userData;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const signin = async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${apiUrl}/signin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to sign in');
            }

            const userData = await response.json();
            setUser(userData);
            localStorage.setItem('dietplanner_user', JSON.stringify(userData));
            return userData;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const signout = async () => {
        setLoading(true);
        setError(null);
        try {
            await fetch(`${apiUrl}/signout`, {
                method: 'POST'
            });

            setUser(null);
            localStorage.removeItem('dietplanner_user');
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, error, signup, signin, signout, apiUrl }}>
            {children}
        </AuthContext.Provider>
    );
};