import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/logo.svg';

const VerifyOTP = () => {
  const [otp, setOtp] = useState('');
  const { verifyOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(null);

  const email = location.state?.email;
  const redirectTo = location.state?.from || '/dashboard';

  if (!email) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-purple-50">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border border-purple-100 text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-4">Email not found. Please register or login again.</p>
          <button 
            onClick={() => navigate('/login')}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await verifyOtp(email, otp);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-purple-50">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border border-purple-100">
        <div className="flex justify-center mb-6">
          <img src={logo} alt="GiftSutra" className="h-12 w-auto" />
        </div>
        <h2 className="text-3xl font-bold text-center text-purple-800 mb-2">Verify OTP</h2>
        <p className="text-center text-sm text-gray-600 mb-8">
          We have sent a One-Time Password to <span className="font-medium text-purple-600">{email}</span>.
        </p>
        
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Enter OTP</label>
            <input 
              type="text" 
              required 
              maxLength={6}
              value={otp} 
              onChange={(e) => setOtp(e.target.value)} 
              className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all tracking-widest text-center text-xl"
              placeholder="123456"
            />
          </div>
          <button 
            type="submit" 
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
          >
            Verify
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyOTP;
