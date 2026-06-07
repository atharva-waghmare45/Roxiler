import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { getOwnerDashboard } from '../api/owner';
import { toast } from 'react-toastify';
import { Store, Star, MessageSquare, Search, ArrowUpDown, MapPin, Mail, Calendar, User } from 'lucide-react';

const Owner = () => {
  const [stores, setStores] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search filter states (client-side)
  const [storesSearch, setStoresSearch] = useState('');
  const [reviewsSearch, setReviewsSearch] = useState('');

  // Sorting states (server-side via API calls)
  const [storesSort, setStoresSort] = useState({ sortBy: 'name', sortOrder: 'asc' });
  const [reviewsSort, setReviewsSort] = useState({ sortBy: 'ratedAt', sortOrder: 'desc' });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await getOwnerDashboard({
        storesSortBy: storesSort.sortBy,
        storesSortOrder: storesSort.sortOrder,
        reviewsSortBy: reviewsSort.sortBy,
        reviewsSortOrder: reviewsSort.sortOrder
      });
      setStores(data.stores || []);
      setReviews(data.reviews || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [storesSort, reviewsSort]);

  // Sorting Toggles
  const handleStoresSort = (field) => {
    setStoresSort((prev) => ({
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleReviewsSort = (field) => {
    setReviewsSort((prev) => ({
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Calculations for Metrics Summary
  const totalStores = stores.length;
  const totalRatingsCount = stores.reduce((sum, s) => sum + s.totalRatings, 0);
  const weightedSum = stores.reduce((sum, s) => sum + (s.averageRating * s.totalRatings), 0);
  const overallAvg = totalRatingsCount > 0 ? (weightedSum / totalRatingsCount).toFixed(2) : '0.00';

  // Client-side filtering logic
  const filteredStores = stores.filter((s) => {
    const q = storesSearch.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.address.toLowerCase().includes(q)
    );
  });

  const filteredReviews = reviews.filter((r) => {
    const q = reviewsSearch.toLowerCase();
    return (
      r.userName.toLowerCase().includes(q) ||
      r.userEmail.toLowerCase().includes(q) ||
      r.userAddress.toLowerCase().includes(q) ||
      r.storeName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-slide-up">
        {/* Title Section */}
        <div className="mb-8 text-left">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">Store Owner Dashboard</h1>
          <p className="mt-2 text-slate-500 text-sm md:text-base">
            Track metrics across your registered outlets and monitor customer feedback reviews
          </p>
        </div>

        {/* Metrics Summary Grid */}
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {/* Card 1: Total Stores */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xs flex items-center space-x-4 hover-lift">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
              <Store className="h-6 w-6" />
            </div>
            <div className="text-left">
              <span className="text-xs font-semibold text-slate-400 uppercase">Total Stores</span>
              <p data-testid="total-stores-val" className="text-2xl font-bold text-slate-900 mt-0.5">{totalStores}</p>
            </div>
          </div>

          {/* Card 2: Overall Rating */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xs flex items-center space-x-4 hover-lift">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
              <Star className="h-6 w-6 fill-amber-400 stroke-amber-500" />
            </div>
            <div className="text-left">
              <span className="text-xs font-semibold text-slate-400 uppercase">Overall Avg Rating</span>
              <div className="flex items-baseline space-x-1 mt-0.5">
                <span data-testid="overall-rating-val" className="text-2xl font-bold text-slate-900">{overallAvg}</span>
                <span className="text-xs text-slate-400 font-semibold">/ 5.0</span>
              </div>
            </div>
          </div>

          {/* Card 3: Total Reviews */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xs flex items-center space-x-4 hover-lift">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div className="text-left">
              <span className="text-xs font-semibold text-slate-400 uppercase">Total Reviews</span>
              <p data-testid="total-reviews-val" className="text-2xl font-bold text-slate-900 mt-0.5">{totalRatingsCount}</p>
            </div>
          </div>
        </div>

        {loading && stores.length === 0 && reviews.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
            <p className="mt-3 text-slate-400 text-sm">Loading dashboard metrics...</p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* --- MY STORES SECTION --- */}
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xs">
              <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="text-left">
                  <h2 className="text-xl font-bold text-slate-900">My Stores</h2>
                  <p className="text-xs text-slate-400">Stores assigned under your owner profile</p>
                </div>
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="text"
                    value={storesSearch}
                    onChange={(e) => setStoresSearch(e.target.value)}
                    placeholder="Search stores..."
                    className="w-full rounded-2xl border border-slate-200 pl-9 pr-4 py-2 text-slate-950 text-xs outline-none transition focus:border-purple-500 bg-white"
                  />
                </div>
              </div>

              {/* Mobile View for Stores */}
              <div data-testid="stores-list-mobile" className="grid grid-cols-1 gap-4 md:hidden">
                {filteredStores.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-sm">No stores found.</div>
                ) : (
                  filteredStores.map((s) => (
                    <div key={s.id} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
                      <div className="text-left space-y-1">
                        <h3 className="font-bold text-slate-900">{s.name}</h3>
                        <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{s.address}</span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                          <Mail className="h-3.5 w-3.5" />
                          <span>{s.email}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-2.5 border-t border-slate-100">
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 fill-amber-400 stroke-amber-500" />
                          <span className="font-bold text-slate-800 text-sm">{s.averageRating || '0.00'}</span>
                        </div>
                        <span className="text-xs text-slate-500">
                          {s.totalRatings} {s.totalRatings === 1 ? 'rating' : 'ratings'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop Table for Stores */}
              <div data-testid="stores-list-desktop" className="hidden md:block overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-400 uppercase">
                      <th onClick={() => handleStoresSort('name')} className="px-6 py-4 cursor-pointer hover:text-slate-700 select-none">
                        Store Name <ArrowUpDown className="inline h-3.5 w-3.5 ml-1" />
                      </th>
                      <th onClick={() => handleStoresSort('email')} className="px-6 py-4 cursor-pointer hover:text-slate-700 select-none">
                        Store Email <ArrowUpDown className="inline h-3.5 w-3.5 ml-1" />
                      </th>
                      <th onClick={() => handleStoresSort('address')} className="px-6 py-4 cursor-pointer hover:text-slate-700 select-none">
                        Address <ArrowUpDown className="inline h-3.5 w-3.5 ml-1" />
                      </th>
                      <th onClick={() => handleStoresSort('averageRating')} className="px-6 py-4 cursor-pointer hover:text-slate-700 select-none text-center">
                        Average Rating <ArrowUpDown className="inline h-3.5 w-3.5 ml-1" />
                      </th>
                      <th onClick={() => handleStoresSort('totalRatings')} className="px-6 py-4 cursor-pointer hover:text-slate-700 select-none text-center">
                        Total Ratings <ArrowUpDown className="inline h-3.5 w-3.5 ml-1" />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {filteredStores.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-slate-400">No stores found.</td>
                      </tr>
                    ) : (
                      filteredStores.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/30 transition duration-150">
                          <td className="px-6 py-4 font-bold text-slate-900">{s.name}</td>
                          <td className="px-6 py-4 text-slate-500">{s.email}</td>
                          <td className="px-6 py-4 text-slate-500">{s.address}</td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              <Star className="h-4.5 w-4.5 fill-amber-400 stroke-amber-500" />
                              <span className="font-bold text-slate-800">{s.averageRating || '0.00'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center text-slate-500 font-semibold">{s.totalRatings}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* --- CUSTOMER REVIEWS (REVIEWERS) SECTION --- */}
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xs">
              <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="text-left">
                  <h2 className="text-xl font-bold text-slate-900">Customer Reviews</h2>
                  <p className="text-xs text-slate-400">Feedback submitted by customers for your outlets</p>
                </div>
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="text"
                    value={reviewsSearch}
                    onChange={(e) => setReviewsSearch(e.target.value)}
                    placeholder="Search reviews..."
                    className="w-full rounded-2xl border border-slate-200 pl-9 pr-4 py-2 text-slate-950 text-xs outline-none transition focus:border-purple-500 bg-white"
                  />
                </div>
              </div>

              {/* Mobile View for Reviews */}
              <div data-testid="reviews-list-mobile" className="grid grid-cols-1 gap-4 md:hidden">
                {filteredReviews.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-sm">No reviews submitted yet.</div>
                ) : (
                  filteredReviews.map((r, index) => (
                    <div key={index} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="text-left">
                          <p className="font-bold text-slate-900">{r.userName}</p>
                          <p className="text-xs text-slate-400">{r.userEmail}</p>
                        </div>
                        <div className="flex items-center space-x-0.5 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-lg">
                          <Star className="h-3.5 w-3.5 fill-amber-400 stroke-amber-500" />
                          <span className="font-bold text-amber-700 text-xs">{r.ratingValue}</span>
                        </div>
                      </div>
                      <div className="text-left text-xs text-slate-500 space-y-1">
                        <p>Store: <span className="font-semibold text-slate-700">{r.storeName}</span></p>
                        <p className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{r.userAddress}</span>
                        </p>
                        <p className="flex items-center space-x-1 text-[10px] text-slate-400 pt-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(r.ratedAt).toLocaleDateString()}</span>
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop Table for Reviews */}
              <div data-testid="reviews-list-desktop" className="hidden md:block overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-400 uppercase">
                      <th onClick={() => handleReviewsSort('userName')} className="px-6 py-4 cursor-pointer hover:text-slate-700 select-none">
                        Reviewer <ArrowUpDown className="inline h-3.5 w-3.5 ml-1" />
                      </th>
                      <th onClick={() => handleReviewsSort('userEmail')} className="px-6 py-4 cursor-pointer hover:text-slate-700 select-none">
                        Email <ArrowUpDown className="inline h-3.5 w-3.5 ml-1" />
                      </th>
                      <th onClick={() => handleReviewsSort('userAddress')} className="px-6 py-4 cursor-pointer hover:text-slate-700 select-none">
                        Address <ArrowUpDown className="inline h-3.5 w-3.5 ml-1" />
                      </th>
                      <th onClick={() => handleReviewsSort('storeName')} className="px-6 py-4 cursor-pointer hover:text-slate-700 select-none">
                        Outlet <ArrowUpDown className="inline h-3.5 w-3.5 ml-1" />
                      </th>
                      <th onClick={() => handleReviewsSort('ratingValue')} className="px-6 py-4 cursor-pointer hover:text-slate-700 select-none text-center">
                        Rating <ArrowUpDown className="inline h-3.5 w-3.5 ml-1" />
                      </th>
                      <th onClick={() => handleReviewsSort('ratedAt')} className="px-6 py-4 cursor-pointer hover:text-slate-700 select-none text-center">
                        Submitted Date <ArrowUpDown className="inline h-3.5 w-3.5 ml-1" />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {filteredReviews.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-slate-400">No reviews submitted yet.</td>
                      </tr>
                    ) : (
                      filteredReviews.map((r, index) => (
                        <tr key={index} className="hover:bg-slate-50/30 transition duration-150">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 font-semibold text-xs">
                                <User className="h-3.5 w-3.5" />
                              </div>
                              <span className="font-bold text-slate-900">{r.userName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-500">{r.userEmail}</td>
                          <td className="px-6 py-4 text-slate-500">{r.userAddress}</td>
                          <td className="px-6 py-4 text-slate-900 font-semibold">{r.storeName}</td>
                          <td className="px-6 py-4 text-center">
                            <div className="inline-flex items-center space-x-1 bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-full">
                              <Star className="h-3.5 w-3.5 fill-amber-400 stroke-amber-500" />
                              <span className="font-bold text-amber-700 text-xs">{r.ratingValue}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center text-slate-400 text-xs">
                            {new Date(r.ratedAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Owner;
