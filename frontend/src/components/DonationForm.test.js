import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DonationForm from './DonationForm';
import { AuthProvider } from '../../contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';

const MockedDonationForm = () => (
  <BrowserRouter>
    <AuthProvider>
      <DonationForm />
    </AuthProvider>
  </BrowserRouter>
);

describe('DonationForm Component', () => {
  test('renders donation form fields', () => {
    render(<MockedDonationForm />);

    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/condition/i)).toBeInTheDocument();
  });

  test('validates required fields', async () => {
    render(<MockedDonationForm />);

    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/required/i)).toBeInTheDocument();
    });
  });

  test('submits form with valid data', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
    );

    render(<MockedDonationForm />);

    await userEvent.type(screen.getByLabelText(/category/i), 'Clothes');
    await userEvent.type(screen.getByLabelText(/quantity/i), '10');
    await userEvent.selectOptions(screen.getByLabelText(/condition/i), 'New');

    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
  });
});
