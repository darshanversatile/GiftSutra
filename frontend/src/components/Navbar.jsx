import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logonew.png';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white shadow-md border-b border-purple-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/">
              <img src={logo} alt="GiftSutra" className="h-16 w-auto" />
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/dashboard" className="text-purple-700 hover:bg-purple-50 px-3 py-2 rounded-md font-medium transition-colors">Dashboard</Link>
                <Link to="/events" className="text-purple-700 hover:bg-purple-50 px-3 py-2 rounded-md font-medium transition-colors">Events</Link>
                <Link to="/my-gifts" className="text-purple-700 hover:bg-purple-50 px-3 py-2 rounded-md font-medium transition-colors">My Gifts</Link>
                <Link to="/profile" className="text-purple-700 hover:bg-purple-50 px-3 py-2 rounded-md font-medium transition-colors">Profile</Link>
                <button onClick={logout} className="bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded-md shadow transition-colors font-medium">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-purple-700 hover:bg-purple-50 px-3 py-2 rounded-md font-medium transition-colors">Login</Link>
                <Link to="/signup" className="bg-purple-700 text-white hover:bg-purple-800 px-4 py-2 rounded-md font-semibold transition-colors shadow">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
