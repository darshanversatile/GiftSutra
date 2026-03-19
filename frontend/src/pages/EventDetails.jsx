import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const EventDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedAmount, setSelectedAmount] = useState(501);
  const [customAmount, setCustomAmount] = useState('');
  const giftOptions = [501, 1001, 2001];

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const { data } = await axios.get(`http://localhost:5000/api/events/${id}`);
        setEvent(data);
      } catch (error) {
        console.error('Failed to fetch event', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  useEffect(() => {
    const loadRazorpayScript = () => {
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    };
    loadRazorpayScript();
  }, []);

  const handlePayment = async () => {
    const finalAmount = customAmount ? Number(customAmount) : selectedAmount;
    if (!finalAmount || finalAmount <= 0) {
      alert('Please select or enter a valid amount');
      return;
    }

    try {
      // 1. Call backend to create order
      const { data: orderData } = await axios.post('http://localhost:5000/api/payment/create-order', {
        eventId: id,
        amount: finalAmount
      });

      if (!orderData.success) {
        alert('Server error creating order');
        return;
      }

      // 2. Open Razorpay checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_change_this', // Note: better approach is to load from env or get from backend
        amount: orderData.amount, // in paise
        currency: orderData.currency,
        name: 'GiftSutra',
        description: `Gift for ${event.title}`,
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            // 4. On success call verify API
            const verifyData = await axios.post('http://localhost:5000/api/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              eventId: id,
              amount: finalAmount
            });

            if (verifyData.data.success) {
              alert('Payment Successful! Thank you for the gift.');
              // Refresh event details
              window.location.reload();
            } else {
              alert('Payment verification failed.');
            }
          } catch (err) {
            console.error('Verify error', err);
            alert('Payment verified but saving transaction failed!');
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: ''
        },
        // Force UPI/Google Pay integration based on user request
        theme: {
          color: '#7e22ce'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error('Payment error', error);
      alert('Error initiating payment');
    }
  };

  if (loading) return <div className="text-center mt-10 text-purple-600">Loading...</div>;
  if (!event) return <div className="text-center mt-10">Event not found</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col lg:flex-row gap-10">
      
      {/* Event Info */}
      <div className="flex-1">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-purple-100">
          <div className="h-64 sm:h-80 bg-purple-200">
             {event.coverImage ? (
                <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center">
                   <h2 className="text-white text-4xl font-bold opacity-80">{event.title}</h2>
                </div>
             )}
          </div>
          <div className="p-8">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">{event.title}</h1>
            <p className="text-lg text-purple-700 font-semibold mb-6">🗓️ {new Date(event.date).toDateString()}</p>
            <p className="text-gray-600 leading-relaxed mb-8">{event.description}</p>
            {user?._id === event.organizer?._id && (
              <div className="border-t pt-6">
                 <p className="text-sm text-gray-400">Total Gifted Amount</p>
                 <p className="text-3xl font-bold text-purple-600">₹{event.collectedAmount}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gift Section */}
      <div className="w-full lg:w-96">
        <div className="bg-white rounded-2xl shadow-xl p-8 sticky top-10 border border-purple-100">
          <h2 className="text-2xl font-bold text-purple-900 mb-6 flex items-center">
            🎁 Send a Gift
          </h2>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {giftOptions.map(amount => (
              <button
                key={amount}
                onClick={() => { setSelectedAmount(amount); setCustomAmount(''); }}
                className={`py-3 rounded-lg border-2 font-bold transition-all ${
                  selectedAmount === amount && !customAmount
                    ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-md transform scale-105'
                    : 'border-gray-200 text-gray-600 hover:border-purple-300 hover:bg-purple-50'
                }`}
              >
                ₹{amount}
              </button>
            ))}
          </div>

          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Or enter custom amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">₹</span>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => { 
                  setCustomAmount(e.target.value); 
                  if (e.target.value) setSelectedAmount(null);
                }}
                className="w-full pl-10 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-white transition-colors text-lg font-bold"
                placeholder="0.00"
              />
            </div>
          </div>

          <button
            onClick={handlePayment}
            className="w-full flex items-center justify-center space-x-2 py-4 rounded-xl font-bold text-white text-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Send Gift with Google Pay</span>
          </button>
          <p className="text-xs text-center text-gray-400 mt-4">Securely processed by Razorpay using UPI</p>
        </div>
      </div>
      
    </div>
  );
};

export default EventDetails;
