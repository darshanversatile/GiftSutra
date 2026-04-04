import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../assets/logo.svg';

const Login = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email);
      navigate('/verify-otp', { state: { email } });
    } catch (err) {
      if (err.response?.status === 403) {
        navigate('/verify-otp', { state: { email } });
      } else {
        setError(err.response?.data?.message || 'Login failed. User not found.');
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-purple-50 px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border border-purple-100">
        <div className="flex justify-center mb-6">
          <img src={logo} alt="GiftSutra" className="h-20 w-auto" />
        </div>
        <h2 className="text-3xl font-bold text-center text-purple-800 mb-8">Welcome Back</h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="you@example.com"
            />
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
          >
            Sign In
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="font-medium text-purple-600 hover:text-purple-500">
            Sign up now
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
