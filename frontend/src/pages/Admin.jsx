import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import {
  getDashboardStats,
  listUsers,
  listStores,
  createUser,
  createStore
} from '../api/admin';
import { toast } from 'react-toastify';
import {
  Users,
  Store,
  Star,
  Search,
  Plus,
  ArrowUpDown,
  UserCheck,
  Building,
  Info,
  X
} from 'lucide-react';

const Admin = () => {
  // Stats
  const [stats, setStats] = useState({ totalUsers: 0, totalStores: 0, totalRatings: 0 });

  // Tab: 'users' | 'stores'
  const [activeTab, setActiveTab] = useState('users');

  // Listings data
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);

  // Search & Filtering
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [storeSearch, setStoreSearch] = useState('');

  // Sorting
  const [userSort, setUserSort] = useState({ sortBy: 'name', sortOrder: 'asc' });
  const [storeSort, setStoreSort] = useState({ sortBy: 'name', sortOrder: 'asc' });

  // Modals visibility
  const [showUserModal, setShowUserModal] = useState(false);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);

  // Add User Form States
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    address: '',
    password: '',
    role: 'NORMAL_USER'
  });

  // Add Store Form States
  const [newStore, setNewStore] = useState({
    name: '',
    email: '',
    address: '',
    ownerId: ''
  });
  const [storeOwners, setStoreOwners] = useState([]); // Selected to link store

  // Loading States
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingListings, setLoadingListings] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Load dashboard stats
  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      toast.error('Failed to load dashboard metrics.');
    } finally {
      setLoadingStats(false);
    }
  };

  // Load users listing
  const fetchUsers = async () => {
    try {
      setLoadingListings(true);
      const data = await listUsers({
        search: userSearch,
        role: userRoleFilter,
        sortBy: userSort.sortBy,
        sortOrder: userSort.sortOrder
      });
      setUsers(data);
    } catch (err) {
      toast.error('Failed to load users list.');
    } finally {
      setLoadingListings(false);
    }
  };

  // Load stores listing
  const fetchStores = async () => {
    try {
      setLoadingListings(true);
      const data = await listStores({
        search: storeSearch,
        sortBy: storeSort.sortBy,
        sortOrder: storeSort.sortOrder
      });
      setStores(data);
    } catch (err) {
      toast.error('Failed to load stores list.');
    } finally {
      setLoadingListings(false);
    }
  };

  // Load Store Owners for Select Dropdown
  const fetchOwners = async () => {
    try {
      const data = await listUsers({ role: 'STORE_OWNER' });
      setStoreOwners(data);
    } catch (err) {
      toast.error('Failed to load store owners list.');
    }
  };

  // Trigger loading on changes
  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else {
      fetchStores();
    }
  }, [activeTab, userSearch, userRoleFilter, storeSearch, userSort, storeSort]);

  // Handle Sort changes
  const toggleUserSort = (field) => {
    setUserSort((prev) => ({
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  const toggleStoreSort = (field) => {
    setStoreSort((prev) => ({
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Add User Submission
  const handleCreateUser = async (e) => {
    e.preventDefault();
    // Validations
    if (newUser.name.trim().length < 20 || newUser.name.trim().length > 60) {
      toast.error('Name must be between 20 and 60 characters.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      toast.error('Invalid email address.');
      return;
    }
    if (newUser.address.trim().length > 400) {
      toast.error('Address cannot exceed 400 characters.');
      return;
    }
    if (newUser.password.length < 8 || newUser.password.length > 16) {
      toast.error('Password must be between 8 and 16 characters.');
      return;
    }
    const hasUppercase = /[A-Z]/.test(newUser.password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newUser.password);
    if (!hasUppercase || !hasSpecial) {
      toast.error('Password must contain at least one uppercase letter and one special character.');
      return;
    }

    try {
      setSubmitLoading(true);
      const data = await createUser(newUser);
      toast.success(data.message || 'User added successfully!');
      setShowUserModal(false);
      setNewUser({ name: '', email: '', address: '', password: '', role: 'NORMAL_USER' });
      fetchUsers();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add user.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Add Store Submission
  const handleCreateStore = async (e) => {
    e.preventDefault();
    if (!newStore.name.trim()) {
      toast.error('Store name is required.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newStore.email)) {
      toast.error('Invalid store email address.');
      return;
    }
    if (newStore.address.trim().length > 400) {
      toast.error('Address cannot exceed 400 characters.');
      return;
    }
    if (!newStore.ownerId) {
      toast.error('Assigned owner is required.');
      return;
    }

    try {
      setSubmitLoading(true);
      const data = await createStore({
        name: newStore.name,
        email: newStore.email,
        address: newStore.address,
        ownerId: parseInt(newStore.ownerId, 10)
      });
      toast.success(data.message || 'Store registered successfully!');
      setShowStoreModal(false);
      setNewStore({ name: '', email: '', address: '', ownerId: '' });
      fetchStores();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register store.');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <Navbar />

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-slide-up">
        
        {/* Header Title */}
        <div className="mb-8 text-left">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">Admin Control Board</h1>
          <p className="mt-2 text-slate-500 text-sm md:text-base">Monitor users, register stores, and check rating metrics</p>
        </div>

        {/* Dashboard Stat Counters (Mobile First Grid) */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
          {/* Card: Total Users */}
          <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-xs flex items-center justify-between hover-lift">
            <div className="space-y-1 text-left">
              <span className="text-sm font-semibold text-slate-400">Total System Users</span>
              <p className="text-3xl font-bold text-slate-900">{stats.totalUsers}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
              <Users className="h-6 w-6" />
            </div>
          </div>

          {/* Card: Total Stores */}
          <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-xs flex items-center justify-between hover-lift">
            <div className="space-y-1 text-left">
              <span className="text-sm font-semibold text-slate-400">Registered Stores</span>
              <p className="text-3xl font-bold text-slate-900">{stats.totalStores}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Store className="h-6 w-6" />
            </div>
          </div>

          {/* Card: Total Ratings */}
          <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-xs flex items-center justify-between hover-lift">
            <div className="space-y-1 text-left">
              <span className="text-sm font-semibold text-slate-400">Ratings Submitted</span>
              <p className="text-3xl font-bold text-slate-900">{stats.totalRatings}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <Star className="h-6 w-6 fill-amber-400 stroke-amber-500" />
            </div>
          </div>
        </div>

        {/* Listings Control Center */}
        <div className="rounded-3xl border border-slate-100 bg-white shadow-xs p-6">
          {/* Controls Header: Tabs + Modals trigger */}
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 pb-6 border-b border-slate-100">
            {/* Tabs */}
            <div className="flex space-x-2 rounded-2xl bg-slate-50 p-1.5 border border-slate-100 self-start">
              <button
                onClick={() => setActiveTab('users')}
                className={`rounded-xl px-5 py-2 text-sm font-bold transition duration-200 ${
                  activeTab === 'users' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Users List
              </button>
              <button
                onClick={() => setActiveTab('stores')}
                className={`rounded-xl px-5 py-2 text-sm font-bold transition duration-200 ${
                  activeTab === 'stores' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Stores List
              </button>
            </div>

            {/* Quick Actions (Add user/store) */}
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => setShowUserModal(true)}
                className="flex items-center space-x-1.5 rounded-2xl bg-purple-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-purple-100 hover:bg-purple-700 transition"
              >
                <Plus className="h-4 w-4" />
                <span>Add User</span>
              </button>
              <button
                onClick={() => {
                  fetchOwners();
                  setShowStoreModal(true);
                }}
                className="flex items-center space-x-1.5 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 transition"
              >
                <Plus className="h-4 w-4" />
                <span>Add Store</span>
              </button>
            </div>
          </div>

          {/* Filtering / Search input section */}
          <div className="py-5 flex flex-col gap-4 sm:flex-row sm:items-center">
            {activeTab === 'users' ? (
              <>
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search users..."
                    className="w-full rounded-2xl border border-slate-200 pl-10.5 pr-4 py-3 text-slate-900 text-sm outline-none transition focus:border-purple-500"
                  />
                </div>
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-slate-700 text-sm outline-none transition focus:border-purple-500 bg-white"
                >
                  <option value="">All Roles</option>
                  <option value="SYSTEM_ADMIN">System Admin</option>
                  <option value="STORE_OWNER">Store Owner</option>
                  <option value="NORMAL_USER">Customer</option>
                </select>
              </>
            ) : (
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="text"
                  value={storeSearch}
                  onChange={(e) => setStoreSearch(e.target.value)}
                  placeholder="Search stores..."
                  className="w-full rounded-2xl border border-slate-200 pl-10.5 pr-4 py-3 text-slate-900 text-sm outline-none transition focus:border-purple-500"
                />
              </div>
            )}
          </div>

          {/* Table Container (Horizontal scroll on mobile) */}
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            {loadingListings ? (
              <div className="py-20 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
                <p className="mt-3 text-slate-400 text-sm">Loading listings data...</p>
              </div>
            ) : activeTab === 'users' ? (
              <table className="w-full min-w-[700px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-400 uppercase">
                    <th onClick={() => toggleUserSort('name')} className="px-6 py-4 cursor-pointer hover:text-slate-700 select-none">
                      Name <ArrowUpDown className="inline h-3.5 w-3.5 ml-1" />
                    </th>
                    <th onClick={() => toggleUserSort('email')} className="px-6 py-4 cursor-pointer hover:text-slate-700 select-none">
                      Email <ArrowUpDown className="inline h-3.5 w-3.5 ml-1" />
                    </th>
                    <th onClick={() => toggleUserSort('address')} className="px-6 py-4 cursor-pointer hover:text-slate-700 select-none">
                      Address <ArrowUpDown className="inline h-3.5 w-3.5 ml-1" />
                    </th>
                    <th onClick={() => toggleUserSort('role')} className="px-6 py-4 cursor-pointer hover:text-slate-700 select-none">
                      Role <ArrowUpDown className="inline h-3.5 w-3.5 ml-1" />
                    </th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-slate-400">No users found.</td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition duration-150">
                        <td className="px-6 py-4 font-bold text-slate-900">{u.name}</td>
                        <td className="px-6 py-4 text-slate-500">{u.email}</td>
                        <td className="px-6 py-4 max-w-[200px] truncate text-slate-500">{u.address}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            u.role === 'SYSTEM_ADMIN'
                              ? 'bg-red-50 text-red-700 border border-red-100'
                              : u.role === 'STORE_OWNER'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          }`}>
                            {u.role === 'SYSTEM_ADMIN' ? 'Admin' : u.role === 'STORE_OWNER' ? 'Owner' : 'Customer'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => setSelectedUserDetail(u)}
                            className="inline-flex items-center space-x-1 text-purple-600 hover:text-purple-700 font-bold hover:underline"
                          >
                            <Info className="h-4 w-4" />
                            <span>Details</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full min-w-[700px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-400 uppercase">
                    <th onClick={() => toggleStoreSort('name')} className="px-6 py-4 cursor-pointer hover:text-slate-700 select-none">
                      Store Name <ArrowUpDown className="inline h-3.5 w-3.5 ml-1" />
                    </th>
                    <th onClick={() => toggleStoreSort('email')} className="px-6 py-4 cursor-pointer hover:text-slate-700 select-none">
                      Email <ArrowUpDown className="inline h-3.5 w-3.5 ml-1" />
                    </th>
                    <th onClick={() => toggleStoreSort('address')} className="px-6 py-4 cursor-pointer hover:text-slate-700 select-none">
                      Address <ArrowUpDown className="inline h-3.5 w-3.5 ml-1" />
                    </th>
                    <th onClick={() => toggleStoreSort('average_rating')} className="px-6 py-4 cursor-pointer hover:text-slate-700 select-none text-center">
                      Average Rating <ArrowUpDown className="inline h-3.5 w-3.5 ml-1" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {stores.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-slate-400">No stores found.</td>
                    </tr>
                  ) : (
                    stores.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition duration-150">
                        <td className="px-6 py-4 font-bold text-slate-900">{s.name}</td>
                        <td className="px-6 py-4 text-slate-500">{s.email}</td>
                        <td className="px-6 py-4 text-slate-500">{s.address}</td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <Star className="h-4.5 w-4.5 fill-amber-400 stroke-amber-500" />
                            <span className="font-bold text-slate-800">{s.rating || '0.00'}</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* Add User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-950 flex items-center space-x-1.5">
                <UserCheck className="h-5 w-5 text-purple-600" />
                <span>Add System User</span>
              </h3>
              <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600">Name</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Your name"
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 text-sm outline-none transition focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600">Email Address</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="Your email"
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 text-sm outline-none transition focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600">Address</label>
                <textarea
                  value={newUser.address}
                  onChange={(e) => setNewUser({ ...newUser, address: e.target.value })}
                  placeholder="Your address"
                  rows={2}
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 text-sm outline-none transition focus:border-purple-500 resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600">Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Your password"
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 text-sm outline-none transition focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600">User Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 text-sm outline-none transition focus:border-purple-500 bg-white"
                >
                  <option value="NORMAL_USER">Customer (NORMAL_USER)</option>
                  <option value="STORE_OWNER">Store Owner (STORE_OWNER)</option>
                  <option value="SYSTEM_ADMIN">System Admin (SYSTEM_ADMIN)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={submitLoading}
                className="w-full rounded-2xl bg-purple-600 py-2.5 font-bold text-white shadow-md shadow-purple-100 hover:bg-purple-700 transition duration-200 disabled:opacity-50 mt-2 flex justify-center"
              >
                {submitLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  'Create User'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Store Modal */}
      {showStoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-950 flex items-center space-x-1.5">
                <Building className="h-5 w-5 text-indigo-600" />
                <span>Register Store</span>
              </h3>
              <button onClick={() => setShowStoreModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStore} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600">Store Name</label>
                <input
                  type="text"
                  value={newStore.name}
                  onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
                  placeholder="Store name"
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 text-sm outline-none transition focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600">Store Email</label>
                <input
                  type="email"
                  value={newStore.email}
                  onChange={(e) => setNewStore({ ...newStore, email: e.target.value })}
                  placeholder="Store email"
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 text-sm outline-none transition focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600">Address</label>
                <textarea
                  value={newStore.address}
                  onChange={(e) => setNewStore({ ...newStore, address: e.target.value })}
                  placeholder="Store address"
                  rows={2}
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 text-sm outline-none transition focus:border-indigo-500 resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600">Assign Store Owner</label>
                <select
                  value={newStore.ownerId}
                  onChange={(e) => setNewStore({ ...newStore, ownerId: e.target.value })}
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 text-sm outline-none transition focus:border-indigo-500 bg-white"
                  required
                >
                  <option value="">Select a Store Owner</option>
                  {storeOwners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.name} ({owner.email})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[10px] text-slate-400">Only users with STORE_OWNER role are selectable.</p>
              </div>

              <button
                type="submit"
                disabled={submitLoading}
                className="w-full rounded-2xl bg-indigo-600 py-2.5 font-bold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 transition duration-200 disabled:opacity-50 mt-2 flex justify-center"
              >
                {submitLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  'Register Store'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* User Details Modal (Displays Rating for Store Owner) */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-950 flex items-center space-x-1.5">
                <Info className="h-5 w-5 text-purple-600" />
                <span>User Record Profile</span>
              </h3>
              <button onClick={() => setSelectedUserDetail(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-left">
              <div>
                <span className="text-xs font-semibold text-slate-400">Full Name</span>
                <p className="font-bold text-slate-900">{selectedUserDetail.name}</p>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400">Email Address</span>
                <p className="font-medium text-slate-800">{selectedUserDetail.email}</p>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400">Address</span>
                <p className="font-medium text-slate-600">{selectedUserDetail.address}</p>
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-xs font-semibold text-slate-400">Account Role</span>
                  <p className="font-bold text-slate-800 mt-0.5">{selectedUserDetail.role}</p>
                </div>
                {selectedUserDetail.role === 'STORE_OWNER' && (
                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-400">Owner Store Avg Rating</span>
                    <div className="flex items-center space-x-1 mt-0.5">
                      <Star className="h-4.5 w-4.5 fill-amber-400 stroke-amber-500" />
                      <p className="font-bold text-slate-900">{selectedUserDetail.rating || '0.00'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
