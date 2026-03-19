import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data } = await axios.put('http://localhost:5000/api/auth/profile', 
        { name, avatar },
        { withCredentials: true }
      );
      setUser(data);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile', error);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-white rounded-xl shadow p-8 border border-purple-100 flex flex-col md:flex-row items-center md:items-start shadow-lg">
         <div className="mb-6 md:mb-0 md:mr-8 flex flex-col items-center">
           <img 
             src={isEditing ? avatar || 'https://via.placeholder.com/150' : user?.avatar || 'https://via.placeholder.com/150'} 
             alt="Profile Avatar" 
             className="w-32 h-32 rounded-full border-4 border-purple-200 shadow-md object-cover mb-4" 
           />
         </div>
         <div className="flex-1 w-full text-center md:text-left">
           {isEditing ? (
             <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Display Name</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-purple-500 focus:border-purple-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Avatar URL</label>
                  <input 
                    type="url" 
                    value={avatar} 
                    onChange={e => setAvatar(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-purple-500 focus:border-purple-500" 
                  />
                </div>
                <div className="flex justify-center md:justify-start space-x-4 pt-2">
                  <button 
                    onClick={handleSave} 
                    disabled={loading}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-bold transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button 
                    onClick={() => { setIsEditing(false); setName(user?.name||''); setAvatar(user?.avatar||''); }} 
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-bold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
             </div>
           ) : (
             <div className="h-full flex flex-col justify-center">
               <h1 className="text-4xl font-black text-purple-900 mb-2">{user?.name}</h1>
               <p className="text-xl text-gray-500 mb-6">{user?.email}</p>
               <div>
                 <button 
                   onClick={() => setIsEditing(true)} 
                   className="bg-purple-100 hover:bg-purple-200 text-purple-800 px-8 py-3 rounded-lg font-bold transition-colors w-full md:w-auto text-lg"
                 >
                    Edit Profile
                 </button>
               </div>
             </div>
           )}
         </div>
      </div>
    </div>
  );
};

export default Profile;
