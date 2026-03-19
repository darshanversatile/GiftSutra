import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MyGifts = () => {
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGifts = async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/api/events/mygifts');
        setGifts(data);
      } catch (error) {
        console.error('Failed to fetch gifts', error);
      } finally {
        setLoading(false);
      }
    };
    fetchGifts();
  }, []);

  if (loading) return <div className="text-center mt-10 text-purple-600">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 border-b pb-4">My Sent Gifts</h1>
      
      {gifts.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-500 text-lg">You haven't sent any gifts yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {gifts.map((gift) => (
              <li key={gift._id} className="p-6 hover:bg-purple-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-purple-800">{gift.eventId?.title || 'Unknown Event'}</h3>
                    <p className="text-sm text-gray-500 mt-1">Transaction ID: {gift.paymentId || gift.orderId}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(gift.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <span className="block text-2xl font-black text-green-600">₹{gift.amount}</span>
                    <span className="inline-block mt-2 px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      {gift.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MyGifts;
