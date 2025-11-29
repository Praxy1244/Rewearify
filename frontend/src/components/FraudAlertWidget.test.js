import { render, screen, waitFor } from '@testing-library/react';
import FraudAlertWidget from '../../components/ai/FraudAlertWidget';

global.fetch = jest.fn();

describe('FraudAlertWidget Component', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders without crashing', () => {
    render(<FraudAlertWidget donationData={{}} />);
  });

  test('displays low risk status', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        risk_level: 'low',
        fraud_score: 0.15,
        is_suspicious: false
      })
    });

    render(<FraudAlertWidget donationData={{ quantity: 10 }} />);

    await waitFor(() => {
      expect(screen.getByText(/low risk/i)).toBeInTheDocument();
    });
  });

  test('displays high risk alert', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        risk_level: 'high',
        fraud_score: 0.95,
        is_suspicious: true,
        reasons: ['Suspicious quantity', 'New user']
      })
    });

    render(<FraudAlertWidget donationData={{ quantity: 1000 }} />);

    await waitFor(() => {
      expect(screen.getByText(/high risk/i)).toBeInTheDocument();
      expect(screen.getByText(/suspicious/i)).toBeInTheDocument();
    });
  });

  test('displays fraud detection reasons', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        risk_level: 'medium',
        reasons: ['Unusual quantity', 'No proof provided']
      })
    });

    render(<FraudAlertWidget donationData={{}} />);

    await waitFor(() => {
      expect(screen.getByText(/Unusual quantity/i)).toBeInTheDocument();
      expect(screen.getByText(/No proof provided/i)).toBeInTheDocument();
    });
  });
});
