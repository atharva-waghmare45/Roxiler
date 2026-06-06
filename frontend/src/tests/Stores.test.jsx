import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider } from '../context/AuthContext';
import Stores from '../pages/Stores';
import { listStores, submitStoreRating } from '../api/user';

vi.mock('../api/user', () => ({
  listStores: vi.fn(),
  submitStoreRating: vi.fn()
}));

const mockUser = { id: 1, name: 'Normal Customer', role: 'NORMAL_USER' };

const renderStores = () => {
  return render(
    <AuthProvider>
      <BrowserRouter>
        <Stores />
      </BrowserRouter>
    </AuthProvider>
  );
};

describe('Stores Component Directory & Rating Widget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('token', 'mock-user-token');
  });

  it('renders search input and title header on mount', async () => {
    listStores.mockResolvedValue([
      { id: 1, name: 'Aaa Store', address: 'Bangalore Road', rating: 4.0, userRating: null }
    ]);

    renderStores();

    expect(screen.getByPlaceholderText(/Search stores by name or address/i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getAllByText('Aaa Store')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Bangalore Road')[0]).toBeInTheDocument();
    });
  });

  it('triggers submitStoreRating API call when a star is clicked', async () => {
    listStores.mockResolvedValue([
      { id: 1, name: 'Aaa Store', address: 'Bangalore Road', rating: 4.0, userRating: null }
    ]);
    submitStoreRating.mockResolvedValueOnce({ message: 'Rating submitted successfully!' });

    renderStores();

    // Wait for the stores list load
    await waitFor(() => {
      expect(screen.getAllByText('Aaa Store')[0]).toBeInTheDocument();
    });

    // Find star buttons. The rating widget has 5 star buttons. Let's click the 4th star button.
    const starBtns = screen.getAllByRole('button');
    // Note: The Navbar also has a Change Password and a Log Out buttons (2 buttons).
    // Let's filter buttons by clicking them, or find the stars.
    // The stars are SVG elements inside buttons.
    // Let's click one of the star buttons.
    // The first star button starts at index 2 (after Navbar buttons Key/Logout).
    // Let's find index 2 (1 star) and click index 5 (4 stars).
    act(() => {
      fireEvent.click(starBtns[5]); // 4-star button
    });

    await waitFor(() => {
      expect(submitStoreRating).toHaveBeenCalledWith(1, 4);
    });
  });
});
