import { render, screen, waitFor } from '@testing-library/react';
import MatchingWidget from '../../components/ai/MatchingWidget';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock fetch
global.fetch = jest.fn();

describe('MatchingWidget Component', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders matching widget', () => {
    render(
      <AuthProvider>
        <MatchingWidget donationId="123" />
      </AuthProvider>
    );

    expect(screen.getByText(/match/i)).toBeInTheDocument();
  });

  test('displays loading state while fetching matches', async () => {
    fetch.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({ matches: [] })
      }), 100))
    );

    render(
      <AuthProvider>
        <MatchingWidget donationId="123" />
      </AuthProvider>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test('displays matches when available', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        matches: [
          { id: '1', ngoName: 'Help NGO', matchScore: 95 },
          { id: '2', ngoName: 'Care Foundation', matchScore: 88 }
        ]
      })
    });

    render(
      <AuthProvider>
        <MatchingWidget donationId="123" />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Help NGO/i)).toBeInTheDocument();
      expect(screen.getByText(/Care Foundation/i)).toBeInTheDocument();
    });
  });

  test('handles error state', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    render(
      <AuthProvider>
        <MatchingWidget donationId="123" />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
