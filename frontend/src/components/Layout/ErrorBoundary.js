import React from 'react';
import ErrorPage from '../../pages/ErrorPage';

// Error Boundaries must be class components.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  // This lifecycle method is triggered when an error is thrown in a child component.
  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  // This lifecycle method is for logging the error information.
  componentDidCatch(error, errorInfo) {
    // This is where you would log the error to a service like Sentry, LogRocket, etc.
    // For now, we'll log it to the console for you, the developer.
    console.error("--- React Application Error Caught by Error Boundary ---");
    console.error("Error:", error);
    console.error("Error Info:", errorInfo);
    this.setState({ error: error });
  }

  render() {
    if (this.state.hasError) {
      // If an error occurred, render our custom error page.
      return <ErrorPage />;
    }

    // Otherwise, render the children components as normal.
    return this.props.children;
  }
}

export default ErrorBoundary;
