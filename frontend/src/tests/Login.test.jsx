import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider } from '../context/AuthContext';
import Login from '../pages/Login';
import { loginUser } from '../api/auth';

vi.mock('../api/auth', () => ({
  loginUser: vi.fn()
}));

const renderLogin = () => {
  return render(
    <AuthProvider>
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    </AuthProvider>
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email and password input fields and submit button', () => {
    renderLogin();
    
    expect(screen.getByPlaceholderText(/john@example.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('triggers login API call on form submission with valid values', async () => {
    loginUser.mockResolvedValueOnce({
      token: 'mock-jwt-token',
      user: { id: 1, name: 'Normal User', role: 'NORMAL_USER' },
      message: 'Login successful.'
    });

    renderLogin();

    const emailInput = screen.getByPlaceholderText(/john@example.com/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);
    const submitBtn = screen.getByRole('button', { name: /Sign In/i });

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(loginUser).toHaveBeenCalledWith('user@example.com', 'password123');
    });
  });
});
