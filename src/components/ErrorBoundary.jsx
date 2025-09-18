import { Component } from 'react';
import { Box, Alert, Button } from '@mui/material';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // You could log to an external service here
    this.setState({ info });
    if (this.props.onError) {
      this.props.onError(error, info);
    }
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught an error', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, info: null });
    if (this.props.onReset) this.props.onReset();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 'var(--spacing-lg)' }}>
          <Alert severity="error" sx={{ mb: 'var(--spacing-md)' }}>
            An unexpected error occurred: {this.state.error?.message}
          </Alert>
          <Button variant="contained" onClick={this.handleReset}>Try again</Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
