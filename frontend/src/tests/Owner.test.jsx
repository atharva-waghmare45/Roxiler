import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider } from '../context/AuthContext';
import Owner from '../pages/Owner';
import { getOwnerDashboard } from '../api/owner';

vi.mock('../api/owner', () => ({
  getOwnerDashboard: vi.fn()
}));

const mockUser = { id: 2, name: 'Store Owner John', role: 'STORE_OWNER' };

const mockStores = [
  { id: 1, name: 'John Outlet A', email: 'outletA@test.com', address: '123 Main St', averageRating: 4.5, totalRatings: 10 },
  { id: 2, name: 'John Outlet B', email: 'outletB@test.com', address: '456 East St', averageRating: 3.0, totalRatings: 5 }
];

const mockReviews = [
  { userName: 'Reviewer Alice', userEmail: 'alice@test.com', userAddress: 'Alice Home', ratingValue: 5, storeName: 'John Outlet A', ratedAt: '2026-06-06T10:00:00Z' },
  { userName: 'Reviewer Bob', userEmail: 'bob@test.com', userAddress: 'Bob Home', ratingValue: 2, storeName: 'John Outlet B', ratedAt: '2026-06-05T09:00:00Z' }
];

const renderOwner = () => {
  return render(
    <AuthProvider>
      <BrowserRouter>
        <Owner />
      </BrowserRouter>
    </AuthProvider>
  );
};

describe('Owner Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('token', 'mock-owner-token');
  });

  it('renders loading states and displays metrics and data tables upon mount', async () => {
    getOwnerDashboard.mockResolvedValue({
      stores: mockStores,
      reviews: mockReviews
    });

    renderOwner();

    // Verify stats cards are rendered with correctly calculated/weighted averages
    // Total stores: 2, Total Reviews: 15, Weighted Avg: (4.5*10 + 3.0*5)/15 = 4.00
    await waitFor(() => {
      expect(screen.getByTestId('total-stores-val')).toHaveTextContent('2');
      expect(screen.getByTestId('overall-rating-val')).toHaveTextContent('4.00');
      expect(screen.getByTestId('total-reviews-val')).toHaveTextContent('15');
    });

    // Verify stores name display in desktop container
    const storesDesktop = screen.getByTestId('stores-list-desktop');
    expect(within(storesDesktop).getByText('John Outlet A')).toBeInTheDocument();
    expect(within(storesDesktop).getByText('John Outlet B')).toBeInTheDocument();

    // Verify reviews/reviewers display in desktop container
    const reviewsDesktop = screen.getByTestId('reviews-list-desktop');
    expect(within(reviewsDesktop).getByText('Reviewer Alice')).toBeInTheDocument();
    expect(within(reviewsDesktop).getByText('Reviewer Bob')).toBeInTheDocument();
  });

  it('filters stores and reviews list client-side based on search inputs', async () => {
    getOwnerDashboard.mockResolvedValue({
      stores: mockStores,
      reviews: mockReviews
    });

    renderOwner();

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('total-stores-val')).toHaveTextContent('2');
    });

    const storesDesktop = screen.getByTestId('stores-list-desktop');
    const storesMobile = screen.getByTestId('stores-list-mobile');
    const reviewsDesktop = screen.getByTestId('reviews-list-desktop');
    const reviewsMobile = screen.getByTestId('reviews-list-mobile');

    expect(within(storesDesktop).getByText('John Outlet A')).toBeInTheDocument();

    // Find the stores search input
    const storesSearchInput = screen.getByPlaceholderText('Search stores...');
    fireEvent.change(storesSearchInput, { target: { value: 'Outlet B' } });

    // "John Outlet A" should not be visible in stores containers, but "John Outlet B" should be
    expect(within(storesDesktop).queryByText('John Outlet A')).not.toBeInTheDocument();
    expect(within(storesMobile).queryByText('John Outlet A')).not.toBeInTheDocument();
    expect(within(storesDesktop).getByText('John Outlet B')).toBeInTheDocument();

    // Clear stores search
    fireEvent.change(storesSearchInput, { target: { value: '' } });
    expect(within(storesDesktop).getByText('John Outlet A')).toBeInTheDocument();

    // Find reviews search input
    const reviewsSearchInput = screen.getByPlaceholderText('Search reviews...');
    fireEvent.change(reviewsSearchInput, { target: { value: 'Alice' } });

    // Reviewer Bob should be hidden in reviews containers, Reviewer Alice remains
    expect(within(reviewsDesktop).queryByText('Reviewer Bob')).not.toBeInTheDocument();
    expect(within(reviewsMobile).queryByText('Reviewer Bob')).not.toBeInTheDocument();
    expect(within(reviewsDesktop).getByText('Reviewer Alice')).toBeInTheDocument();
  });

  it('triggers API requests with updated sort parameters when table headers are clicked', async () => {
    getOwnerDashboard.mockResolvedValue({
      stores: mockStores,
      reviews: mockReviews
    });

    renderOwner();

    // Verify initial load parameters
    await waitFor(() => {
      expect(getOwnerDashboard).toHaveBeenLastCalledWith({
        storesSortBy: 'name',
        storesSortOrder: 'asc',
        reviewsSortBy: 'ratedAt',
        reviewsSortOrder: 'desc'
      });
    });

    // Click on "Store Email" header to trigger stores email sorting
    const emailHeader = screen.getByRole('columnheader', { name: /Store Email/i });
    fireEvent.click(emailHeader);

    await waitFor(() => {
      expect(getOwnerDashboard).toHaveBeenLastCalledWith({
        storesSortBy: 'email',
        storesSortOrder: 'asc',
        reviewsSortBy: 'ratedAt',
        reviewsSortOrder: 'desc'
      });
    });

    // Click on "Reviewer" header to trigger reviews userName sorting
    const reviewerHeader = screen.getByRole('columnheader', { name: /Reviewer/i });
    fireEvent.click(reviewerHeader);

    await waitFor(() => {
      expect(getOwnerDashboard).toHaveBeenLastCalledWith({
        storesSortBy: 'email',
        storesSortOrder: 'asc',
        reviewsSortBy: 'userName',
        reviewsSortOrder: 'asc'
      });
    });
  });
});
