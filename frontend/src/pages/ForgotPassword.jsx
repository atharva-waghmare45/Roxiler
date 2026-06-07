import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { verifyEmail, resetPasswordDirect } from '../api/auth';
import { toast } from 'react-toastify';

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Email is required.');
      return;
    }

    try {
      setLoading(true);
      const data = await verifyEmail(email);
      if (data.success) {
        toast.success(data.message || 'Email verified. You can now reset your password.');
        setStep(2);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Verification failed. Email not found.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      toast.error('All fields are required.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const data = await resetPasswordDirect(email, newPassword);
      toast.success(data.message || 'Password updated successfully!');
      navigate('/login');
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to update password.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-radial from-slate-100 to-slate-200 p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white/80 p-8 shadow-2xl backdrop-blur-md animate-scale-in">
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            {step === 1 ? 'Forgot Password' : 'Reset Password'}
          </h2>
          <p className="mt-2 text-slate-500">
            {step === 1 
              ? 'Enter your email address to reset your password' 
              : 'Enter a new password for your account'}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleVerifyEmail} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. john@example.com"
                className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition duration-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-2xl bg-linear-to-r from-purple-600 to-indigo-600 px-4 py-3 font-semibold text-white shadow-lg shadow-purple-200 transition duration-300 hover:from-purple-700 hover:to-indigo-700 hover:shadow-purple-300 focus:outline-none disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                'Verify Email'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition duration-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                required
              />
              <p className="mt-1 text-xs text-slate-500">8-16 characters, 1 uppercase, 1 special character</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition duration-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-2xl bg-linear-to-r from-purple-600 to-indigo-600 px-4 py-3 font-semibold text-white shadow-lg shadow-purple-200 transition duration-300 hover:from-purple-700 hover:to-indigo-700 hover:shadow-purple-300 focus:outline-none disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600">
            Remembered your password?{' '}
            <Link to="/login" className="font-semibold text-purple-600 hover:text-purple-700 hover:underline">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
