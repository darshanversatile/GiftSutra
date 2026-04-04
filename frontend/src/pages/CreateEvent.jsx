import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CreateEvent = () => {
  const { user, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    coverImage: '',
    isPrivate: false,
    passcode: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please login first.');
        navigate('/login');
        return;
      }

      const { data } = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/events`,
        formData,
        { 
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      navigate(`/events/${data._id}`);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create event';
      setError(errorMessage);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {authLoading ? (
        <div className="bg-white rounded-xl shadow-lg border border-purple-50 p-8 text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      ) : (
      <div className="bg-white rounded-xl shadow-lg border border-purple-50 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 border-b pb-4 border-purple-100">Create New Event</h1>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Rahul's Birthday Gala"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              required
              rows="4"
              value={formData.description}
              onChange={handleChange}
              placeholder="Tell guests about your event..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
            <input
              type="date"
              name="date"
              required
              value={formData.date}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image URL (Optional)</label>
            <input
              type="url"
              name="coverImage"
              value={formData.coverImage}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
            />
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 mb-6">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="isPrivate"
                name="isPrivate"
                checked={formData.isPrivate}
                onChange={handleChange}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="isPrivate" className="ml-2 block text-sm font-bold text-purple-900">
                Make this a Private Event
              </label>
            </div>
            {formData.isPrivate && (
              <div>
                <label className="block text-sm font-medium text-purple-700 mb-1">Event Passcode / Secret Key</label>
                <input
                  type="text"
                  name="passcode"
                  required={formData.isPrivate}
                  value={formData.passcode}
                  onChange={handleChange}
                  placeholder="e.g. 1234 or SECRETGIFT"
                  className="w-full border border-purple-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors bg-white"
                />
                <p className="text-xs text-purple-600 mt-1">Guests will need this key to view the event and send gifts.</p>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="mr-4 text-gray-600 hover:text-gray-900 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-8 rounded-lg shadow-md transition-all ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
      )}
    </div>
  );
};

export default CreateEvent;
