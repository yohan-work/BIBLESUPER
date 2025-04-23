import React from 'react';
import HomePage from './pages/HomePage';
import { AuthProvider } from './contexts/AuthContext';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <HomePage />
      </div>
    </AuthProvider>
  );
}

export default App;
