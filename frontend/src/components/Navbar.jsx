import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { changePassword } from '../api/auth';
import { toast } from 'react-toastify';
import { LogOut, Key, User, ShieldAlert, Menu, X } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (newPassword.length < 8 || newPassword.length > 16) {
      toast.error('New password must be between 8 and 16 characters.');
      return;
    }
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
    if (!hasUppercase || !hasSpecial) {
      toast.error('New password must contain at least one uppercase letter and one special character.');
      return;
    }

    try {
      setLoading(true);
      const data = await changePassword(oldPassword, newPassword);
      toast.success(data.message || 'Password changed successfully!');
      setShowModal(false);
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to update password. Please check your credentials.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'SYSTEM_ADMIN':
        return 'System Admin';
      case 'STORE_OWNER':
        return 'Store Owner';
      case 'NORMAL_USER':
      default:
        return 'Customer';
    }
  };

  return (
    <>
      <nav className="border-b border-slate-100 bg-white shadow-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-200">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">RoxRating</span>
            </div>

            {/* Desktop: Profile & Actions (hidden on mobile) */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-3 rounded-2xl bg-slate-50 px-3 py-1.5 border border-slate-100">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-600 text-xs font-semibold text-white">
                  <User className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-slate-800 leading-3">{user?.name}</p>
                  <span className="text-[10px] text-slate-500 font-medium">{getRoleLabel(user?.role)}</span>
                </div>
              </div>

              <button
                onClick={() => setShowModal(true)}
                className="flex items-center space-x-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none"
              >
                <Key className="h-4 w-4 text-slate-500" />
                <span>Change Password</span>
              </button>

              <button
                onClick={logout}
                className="flex items-center space-x-1.5 rounded-xl bg-red-50 border border-red-100 px-3.5 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 focus:outline-none"
              >
                <LogOut className="h-4 w-4" />
                <span>Log Out</span>
              </button>
            </div>

            {/* Mobile: Hamburger toggle (shown on mobile only) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex items-center justify-center h-10 w-10 rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            mobileMenuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-4 space-y-3">
            {/* User profile badge */}
            <div className="flex items-center space-x-3 rounded-2xl bg-white px-4 py-3 border border-slate-100 shadow-xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-600 text-xs font-semibold text-white">
                <User className="h-4.5 w-4.5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-slate-900">{user?.name}</p>
                <span className="text-xs text-slate-500 font-medium">{getRoleLabel(user?.role)}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowModal(true);
                }}
                className="flex items-center space-x-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 w-full"
              >
                <Key className="h-4 w-4 text-slate-500" />
                <span>Change Password</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="flex items-center space-x-2 rounded-xl bg-red-50 border border-red-100 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 w-full"
              >
                <LogOut className="h-4 w-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Change Password Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl animate-scale-in">
            <div className="mb-4 text-center">
              <h3 className="text-xl font-bold text-slate-950">Change Password</h3>
              <p className="text-sm text-slate-500">Update your credentials to secure your account</p>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700">Current Password</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                  required
                />
                <p className="mt-1 text-[11px] text-slate-400">Must be 8-16 characters with 1 uppercase & 1 special character.</p>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setOldPassword('');
                    setNewPassword('');
                  }}
                  className="w-1/2 rounded-2xl border border-slate-200 py-2.5 font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-1/2 items-center justify-center rounded-2xl bg-linear-to-r from-purple-600 to-indigo-600 py-2.5 font-semibold text-white shadow-md shadow-purple-200 transition hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
