import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function AuthForm() {
  // State variables for form mode and inputs
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Handles form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        // Login request
        const response = await axios.post('http://localhost:5000/auth/login', { email, password });
        console.log('Login success:', response.data);
        navigate('/dashboard');
      } else {
        // Signup request
        const response = await axios.post('http://localhost:5000/auth/register', { name, email, password });
        console.log('Signup success:', response.data);
      }
    } catch (err) {
      // Display error message from the backend (or a default message)
      setError(err.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 p-4">
      <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full">
        {/* Toggle Buttons for Login/Sign Up */}
        <div className="flex justify-center mb-6">
          <button 
            className={`px-6 py-2 mr-2 rounded-full font-semibold focus:outline-none ${isLogin ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setIsLogin(true)}
            disabled={isLogin}
          >
            Login
          </button>
          <button 
            className={`px-6 py-2 rounded-full font-semibold focus:outline-none ${!isLogin ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setIsLogin(false)}
            disabled={!isLogin}
          >
            Sign Up
          </button>
        </div>
        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Conditionally render Name field for signup */}
          {!isLogin && (
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={!isLogin}
              />
            </div>
          )}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button 
            type="submit" 
            className="w-full py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors duration-300"
          >
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AuthForm;
