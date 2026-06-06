import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signupUser } from '../api/auth';
import { toast } from 'react-toastify';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  // Client-side validations
  const validateForm = () => {
    if (name.trim().length < 20 || name.trim().length > 60) {
      toast.error('Name must be between 20 and 60 characters.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Invalid email address format.');
      return false;
    }
    if (address.trim().length > 400) {
      toast.error('Address must not exceed 400 characters.');
      return false;
    }
    if (password.length < 8 || password.length > 16) {
      toast.error('Password must be between 8 and 16 characters.');
      return false;
    }
    const hasUppercase = /[A-Z]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    if (!hasUppercase || !hasSpecial) {
      toast.error('Password must contain at least one uppercase letter and one special character.');
      return false;
    }
    return true;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      const data = await signupUser(name, email, address, password);
      toast.success(data.message || 'Registration successful! Please login.');
      navigate('/login');
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed. Please check your details.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-radial from-slate-100 to-slate-200 p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white/80 p-8 shadow-2xl backdrop-blur-md">
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Create Account</h2>
          <p className="mt-2 text-slate-500">Sign up as a normal user to start rating stores</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Johnathan Doe Smithsonians"
              className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition duration-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              required
            />
            <p className="mt-1 text-xs text-slate-400">Must be between 20 and 60 characters.</p>
          </div>

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

          <div>
            <label className="block text-sm font-semibold text-slate-700">Address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 123 Main Street, Bangalore"
              rows={2}
              className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none transition duration-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 resize-none"
              required
            />
            <p className="mt-1 text-xs text-slate-400">Maximum of 400 characters.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition duration-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              required
            />
            <p className="mt-1 text-xs text-slate-400">Must be 8-16 characters with 1 uppercase & 1 special character.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-2xl bg-linear-to-r from-purple-600 to-indigo-600 px-4 py-3 font-semibold text-white shadow-lg shadow-purple-200 transition duration-300 hover:from-purple-700 hover:to-indigo-700 hover:shadow-purple-300 focus:outline-none disabled:opacity-50"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              'Sign Up'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-purple-600 hover:text-purple-700 hover:underline">
              Log in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
