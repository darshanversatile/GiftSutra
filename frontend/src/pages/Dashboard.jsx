import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const [myEvents, setMyEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyEvents = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/events/myevents`);
        setMyEvents(data);
      } catch (error) {
        console.error('Failed to fetch events');
      } finally {
        setLoading(false);
      }
    };
    fetchMyEvents();
  }, []);

  if (loading) return <div className="text-center mt-10 text-purple-600">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.name}!</h1>
        <Link to="/create-event" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg shadow transition-colors inline-block text-center cursor-pointer">
          + Create New Event
        </Link>
      </div>

      <h2 className="text-2xl font-semibold mb-6 text-purple-800 border-b pb-2">Your Events</h2>
      
      {myEvents.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-10 text-center">
          <p className="text-gray-500 mb-4">You haven't created any events yet.</p>
          <Link to="/create-event" className="bg-purple-100 text-purple-700 hover:bg-purple-200 font-semibold py-2 px-6 rounded-lg transition-colors inline-block text-center cursor-pointer">
            Create Event
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myEvents.map(event => (
            <Link to={`/events/${event._id}`} key={event._id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow overflow-hidden border border-purple-50 group">
              <div className="h-40 bg-purple-200 overflow-hidden relative">
                {event.coverImage ? (
                  <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-purple-400 to-indigo-500"></div>
                )}
                <div className="absolute top-2 right-2 bg-white px-2 py-1 text-xs font-bold text-purple-700 rounded-md shadow">
                  {new Date(event.date).toLocaleDateString()}
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-xl font-bold text-gray-900 mb-2 truncate">{event.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-4">{event.description}</p>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-purple-700 font-semibold bg-purple-50 px-3 py-1 rounded-full">Collected: ₹{event.collectedAmount}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
