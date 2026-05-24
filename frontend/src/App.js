import React from 'react';
import './App.css';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import { AuthProvider, useAuth } from './context/AuthContext';

function MainApp() {
  const { user, signout, apiUrl } = useAuth();
  
  return (
    <div className="App">
      {user ? (
        <Dashboard
          user={user}
          onSignout={signout}
          apiUrl={apiUrl}
        />
      ) : (
        <AuthPage />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
