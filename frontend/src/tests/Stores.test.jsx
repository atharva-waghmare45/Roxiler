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

    // Click the 4th star button using data-testid (use All variant since mobile+desktop both render)
    act(() => {
      fireEvent.click(screen.getAllByTestId('star-btn-1-4')[0]);
    });

    await waitFor(() => {
      expect(submitStoreRating).toHaveBeenCalledWith(1, 4);
    });
  });
});
