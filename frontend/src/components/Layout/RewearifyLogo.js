import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Heart } from 'lucide-react';

// This is a new, reusable component for your brand logo.
// Using this everywhere ensures your branding is always consistent.
const RewearifyLogo = () => {
  return (
    <Link to="/" className="flex justify-center items-center space-x-2 group">
      <div className="relative">
        <Leaf className="h-10 w-10 text-green-600 group-hover:text-green-700 transition-colors" />
        <Heart className="h-5 w-5 text-green-500 absolute -top-1 -right-1 group-hover:text-green-600 transition-colors" />
      </div>
      <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 group-hover:opacity-80 transition-opacity">
        ReWearify
      </span>
    </Link>
  );
};

export default RewearifyLogo;

