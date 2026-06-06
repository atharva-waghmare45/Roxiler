import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Signup from '../pages/Signup';
import { signupUser } from '../api/auth';

vi.mock('../api/auth', () => ({
  signupUser: vi.fn()
}));

const renderSignup = () => {
  return render(
    <BrowserRouter>
      <Signup />
    </BrowserRouter>
  );
};

describe('Signup Component Client-Side Validations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all form input fields', () => {
    renderSignup();

    expect(screen.getByPlaceholderText(/Johnathan Doe Smithsonians/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/john@example.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/123 Main Street, Bangalore/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
  });

  it('does NOT call signup API if fields do not meet rules', async () => {
    renderSignup();

    const nameInput = screen.getByPlaceholderText(/Johnathan Doe Smithsonians/i);
    const emailInput = screen.getByPlaceholderText(/john@example.com/i);
    const submitBtn = screen.getByRole('button', { name: /Sign Up/i });

    // Name too short (only 8 chars, limit is min 20)
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.click(submitBtn);

    expect(signupUser).not.toHaveBeenCalled();
  });

  it('calls signup API if fields are valid', async () => {
    signupUser.mockResolvedValueOnce({ message: 'Registration successful!' });

    renderSignup();

    const nameInput = screen.getByPlaceholderText(/Johnathan Doe Smithsonians/i);
    const emailInput = screen.getByPlaceholderText(/john@example.com/i);
    const addressInput = screen.getByPlaceholderText(/123 Main Street, Bangalore/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);
    const submitBtn = screen.getByRole('button', { name: /Sign Up/i });

    // Valid inputs
    fireEvent.change(nameInput, { target: { value: 'Johnathan Doe Smithsonians' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(addressInput, { target: { value: '123 Main Road, Developer Lane, Bangalore' } });
    fireEvent.change(passwordInput, { target: { value: 'SecurePass1!' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(signupUser).toHaveBeenCalledWith(
        'Johnathan Doe Smithsonians',
        'john@example.com',
        '123 Main Road, Developer Lane, Bangalore',
        'SecurePass1!'
      );
    });
  });
});
