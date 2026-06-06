import React from 'react';
import Navbar from '../components/Navbar';

const Stores = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-slate-900">Stores Directory</h1>
        <p className="mt-2 text-slate-600">Placeholder for Normal User Stores Dashboard (Ticket 4)</p>
      </div>
    </div>
  );
};

export default Stores;
