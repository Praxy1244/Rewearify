import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock authenticated and unauthenticated states
const MockAuthProvider = ({ isAuthenticated, children }) => {
  const mockAuthValue = {
    user: isAuthenticated ? { id: '1', email: 'test@test.com' } : null,
    isAuthenticated,
    login: jest.fn(),
    logout: jest.fn(),
  };

  return (
    <AuthProvider value={mockAuthValue}>
      {children}
    </AuthProvider>
  );
};

describe('ProtectedRoute', () => {
  test('redirects to login when not authenticated', () => {
    render(
      <BrowserRouter>
        <MockAuthProvider isAuthenticated={false}>
          <Routes>
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <div>Protected Content</div>
                </ProtectedRoute>
              } 
            />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MockAuthProvider>
      </BrowserRouter>
    );

    // Should redirect to login
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  test('renders children when authenticated', () => {
    render(
      <BrowserRouter>
        <MockAuthProvider isAuthenticated={true}>
          <Routes>
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <div>Protected Content</div>
                </ProtectedRoute>
              } 
            />
          </Routes>
        </MockAuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
