import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const JoinEvent = () => {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleJoin = (e) => {
    e.preventDefault();
    setError('');

    let eventId = '';
    let passcode = '';

    try {
      // Check if it's a URL
      if (input.includes('http://') || input.includes('https://') || input.includes('localhost')) {
        // Prepend https:// if missing to make it a valid URL object
        const urlString = input.startsWith('http') ? input : `https://${input}`;
        const url = new URL(urlString);
        // Extract ID from path (e.g., /events/12345)
        const pathParts = url.pathname.split('/');
        const eventsIndex = pathParts.indexOf('events');
        if (eventsIndex !== -1 && pathParts.length > eventsIndex + 1) {
          eventId = pathParts[eventsIndex + 1];
        }
        
        // Extract passcode from query
        passcode = url.searchParams.get('passcode') || '';
      } else {
        // Assume it's just the ID
        eventId = input.trim();
      }

      if (!eventId) {
        setError('Could not detect a valid Event ID from your input. Please provide the full link or the exact ID.');
        return;
      }

      // Navigate to the event
      if (passcode) {
        navigate(`/events/${eventId}?passcode=${passcode}`);
      } else {
        navigate(`/events/${eventId}`);
      }

    } catch (err) {
      setError('Invalid link format.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-2xl shadow-xl border border-purple-100">
      <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Join an Event</h2>
      <p className="text-gray-500 mb-6 text-center">Paste an invite link or Event ID</p>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleJoin}>
        <div className="mb-6">
          <input
            type="text"
            required
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. http://localhost:5173/events/123..."
            className="w-full border-2 border-purple-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none transition-colors"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-colors"
        >
          Go to Event
        </button>
      </form>
    </div>
  );
};

export default JoinEvent;
