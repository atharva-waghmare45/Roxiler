import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Stores from './pages/Stores';
import Admin from './pages/Admin';
import Owner from './pages/Owner';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Normal User Route */}
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={['NORMAL_USER']}>
                <Stores />
              </ProtectedRoute>
            }
          />

          {/* Protected System Admin Route */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
                <Admin />
              </ProtectedRoute>
            }
          />

          {/* Protected Store Owner Route */}
          <Route
            path="/owner"
            element={
              <ProtectedRoute allowedRoles={['STORE_OWNER']}>
                <Owner />
              </ProtectedRoute>
            }
          />

          {/* Fallback redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        
        {/* Toast alerts container */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
