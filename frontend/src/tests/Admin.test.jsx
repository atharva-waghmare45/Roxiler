import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider } from '../context/AuthContext';
import Admin from '../pages/Admin';
import { getDashboardStats, listUsers, listStores } from '../api/admin';

vi.mock('../api/admin', () => ({
  getDashboardStats: vi.fn(),
  listUsers: vi.fn(),
  listStores: vi.fn(),
  createUser: vi.fn(),
  createStore: vi.fn()
}));

const mockUser = { id: 1, name: 'System Administrator', role: 'SYSTEM_ADMIN' };

const renderAdmin = () => {
  return render(
    <AuthProvider>
      <BrowserRouter>
        <Admin />
      </BrowserRouter>
    </AuthProvider>
  );
};

describe('Admin Component Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('token', 'mock-admin-token');
  });

  it('loads and displays stats and table lists on mount', async () => {
    getDashboardStats.mockResolvedValueOnce({
      totalUsers: 10,
      totalStores: 5,
      totalRatings: 30
    });
    listUsers.mockResolvedValueOnce([
      { id: 1, name: 'Owner Account user', email: 'owner@test.com', address: 'Bangalore', role: 'STORE_OWNER' }
    ]);

    renderAdmin();

    // Verify stats call
    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('30')).toBeInTheDocument();
    });

    // Verify user table display
    await waitFor(() => {
      expect(screen.getByText('Owner Account user')).toBeInTheDocument();
      expect(screen.getByText('owner@test.com')).toBeInTheDocument();
    });
  });

  it('switches to stores listing when clicking Stores tab', async () => {
    getDashboardStats.mockResolvedValueOnce({ totalUsers: 10, totalStores: 5, totalRatings: 30 });
    listUsers.mockResolvedValueOnce([]);
    listStores.mockResolvedValueOnce([
      { id: 1, name: 'Roxiler Super Market', email: 'super@roxiler.com', address: 'Bangalore Plz', rating: 4.5 }
    ]);

    renderAdmin();

    const storesTab = screen.getByRole('button', { name: /Stores List/i });
    fireEvent.click(storesTab);

    // Verify stores list API call and rendering
    await waitFor(() => {
      expect(listStores).toHaveBeenCalled();
      expect(screen.getByText('Roxiler Super Market')).toBeInTheDocument();
      expect(screen.getByText('super@roxiler.com')).toBeInTheDocument();
    });
  });
});
