import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { listStores, submitStoreRating } from '../api/user';
import { toast } from 'react-toastify';
import { Star, Search, ArrowUpDown, MapPin, Mail, Award } from 'lucide-react';

// Star Rating Widget Component
const RatingWidget = ({ storeId, initialRating, onRatingChange }) => {
  const [hoverRating, setHoverRating] = useState(0);
  const [rating, setRating] = useState(initialRating || 0);

  useEffect(() => {
    setRating(initialRating || 0);
  }, [initialRating]);

  const handleRatingClick = async (val) => {
    try {
      await submitStoreRating(storeId, val);
      setRating(val);
      toast.success('Rating submitted successfully!');
      if (onRatingChange) onRatingChange();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit rating.');
    }
  };

  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleRatingClick(star)}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          className="transition duration-150 focus:outline-none"
        >
          <Star
            className={`h-6 w-6 ${
              star <= (hoverRating || rating)
                ? 'fill-amber-400 stroke-amber-500 scale-110'
                : 'stroke-slate-300 hover:scale-110'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

const Stores = () => {
  const [stores, setStores] = useState([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ sortBy: 'name', sortOrder: 'asc' });
  const [loading, setLoading] = useState(false);

  const fetchStoresList = async () => {
    try {
      setLoading(true);
      const data = await listStores({
        search,
        sortBy: sort.sortBy,
        sortOrder: sort.sortOrder
      });
      setStores(data);
    } catch (err) {
      toast.error('Failed to load store listings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoresList();
  }, [search, sort]);

  const toggleSort = (field) => {
    setSort((prev) => ({
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Header (Left Aligned, Mobile-First responsive margins) */}
        <div className="mb-8 text-left">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">Store Directory</h1>
          <p className="mt-2 text-slate-500 text-sm md:text-base">Browse stores, view overall ratings, and submit your review feedback</p>
        </div>

        {/* Search Control Block */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search stores by name or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 pl-10.5 pr-4 py-3 text-slate-900 text-sm outline-none transition focus:border-purple-500 bg-white"
            />
          </div>
        </div>

        {/* Mobile-First: Table layout on desktop, Cards layout on mobile */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
            <p className="mt-3 text-slate-400 text-sm">Loading stores...</p>
          </div>
        ) : (
          <>
            {/* Grid layout for Mobile / Cards View */}
            <div className="grid grid-cols-1 gap-5 md:hidden">
              {stores.length === 0 ? (
                <div className="py-8 text-center text-slate-400">No stores found.</div>
              ) : (
                stores.map((s) => (
                  <div key={s.id} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xs flex flex-col space-y-4">
                    <div className="text-left space-y-1">
                      <h3 className="text-lg font-bold text-slate-900">{s.name}</h3>
                      <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{s.address}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                        <Mail className="h-3.5 w-3.5" />
                        <span>{s.email}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <div className="text-left">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block">Overall Avg</span>
                        <div className="flex items-center space-x-1 mt-0.5">
                          <Star className="h-4 w-4 fill-amber-400 stroke-amber-500" />
                          <span className="font-bold text-slate-800 text-sm">{s.rating || '0.00'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block">Your Rating</span>
                        <p className="font-bold text-slate-800 text-sm mt-0.5">{s.userRating || 'Unrated'}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex flex-col items-start space-y-2">
                      <span className="text-xs font-semibold text-slate-500 flex items-center space-x-1">
                        <Award className="h-4 w-4 text-purple-600" />
                        <span>Rate this Store:</span>
                      </span>
                      <RatingWidget
                        storeId={s.id}
                        initialRating={s.userRating}
                        onRatingChange={fetchStoresList}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block rounded-3xl border border-slate-100 bg-white shadow-xs p-6 overflow-hidden">
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-400 uppercase">
                      <th onClick={() => toggleSort('name')} className="px-6 py-4 cursor-pointer hover:text-slate-700 select-none">
                        Store Name <ArrowUpDown className="inline h-3.5 w-3.5 ml-1" />
                      </th>
                      <th onClick={() => toggleSort('address')} className="px-6 py-4 cursor-pointer hover:text-slate-700 select-none">
                        Address <ArrowUpDown className="inline h-3.5 w-3.5 ml-1" />
                      </th>
                      <th onClick={() => toggleSort('average_rating')} className="px-6 py-4 cursor-pointer hover:text-slate-700 select-none text-center">
                        Overall Rating <ArrowUpDown className="inline h-3.5 w-3.5 ml-1" />
                      </th>
                      <th className="px-6 py-4 text-center">Your Rating</th>
                      <th className="px-6 py-4 text-center">Submit / Modify Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {stores.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-12 text-center text-slate-400">No stores found.</td>
                      </tr>
                    ) : (
                      stores.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/50 transition duration-150">
                          <td className="px-6 py-4 font-bold text-slate-900">{s.name}</td>
                          <td className="px-6 py-4 text-slate-500">{s.address}</td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              <Star className="h-4.5 w-4.5 fill-amber-400 stroke-amber-500" />
                              <span className="font-bold text-slate-800">{s.rating || '0.00'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              s.userRating
                                ? 'bg-purple-50 text-purple-700 border border-purple-100'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {s.userRating ? `${s.userRating} Stars` : 'Unrated'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center">
                              <RatingWidget
                                storeId={s.id}
                                initialRating={s.userRating}
                                onRatingChange={fetchStoresList}
                              />
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Stores;
