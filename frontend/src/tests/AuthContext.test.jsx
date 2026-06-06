import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '../context/AuthContext';

// Helper component to test useAuth hooks
const TestConsumer = () => {
  const { user, isAuthenticated, login, logout } = useAuth();
  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Guest'}</div>
      <div data-testid="user-name">{user ? user.name : 'No User'}</div>
      <button
        data-testid="btn-login"
        onClick={() => login('mock-token', { name: 'John Doe', role: 'NORMAL_USER' })}
      >
        Login
      </button>
      <button data-testid="btn-logout" onClick={logout}>
        Logout
      </button>
    </div>
  );
};

describe('AuthContext & AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('provides default guest auth state', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-status')).toHaveTextContent('Guest');
    expect(screen.getByTestId('user-name')).toHaveTextContent('No User');
  });

  it('logs in a user correctly and stores token', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    const loginBtn = screen.getByTestId('btn-login');
    act(() => {
      loginBtn.click();
    });

    expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    expect(screen.getByTestId('user-name')).toHaveTextContent('John Doe');
    expect(localStorage.getItem('token')).toBe('mock-token');
  });

  it('logs out a user and clears storage', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    const loginBtn = screen.getByTestId('btn-login');
    const logoutBtn = screen.getByTestId('btn-logout');

    act(() => {
      loginBtn.click();
    });
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');

    act(() => {
      logoutBtn.click();
    });
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Guest');
    expect(localStorage.getItem('token')).toBeNull();
  });
});
