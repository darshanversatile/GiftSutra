import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/api/events');
        setEvents(data);
      } catch (error) {
        console.error('Failed to fetch events', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  if (loading) return <div className="text-center mt-10 text-purple-600">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 border-b pb-4">Explore Events</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {events.map((event) => (
          <Link to={`/events/${event._id}`} key={event._id} className="bg-white rounded-xl shadow hover:shadow-lg transition-shadow overflow-hidden group">
            <div className="h-48 bg-purple-100 relative overflow-hidden">
               {event.coverImage ? (
                  <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center">
                    <span className="text-white font-bold opacity-50">NO IMAGE</span>
                  </div>
                )}
            </div>
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-2 text-purple-900">{event.title}</h2>
              <p className="text-sm text-gray-600 mb-2">Organizer: {event.organizer?.name || 'Unknown'}</p>
              <p className="text-xs text-purple-600 font-bold bg-purple-50 inline-block px-2 py-1 rounded">
                Date: {new Date(event.date).toLocaleDateString()}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Events;
