// Test ErrorBoundary as a plain class (no React Native rendering)
const ErrorBoundary = require('../src/components/ErrorBoundary').default;

describe('ErrorBoundary', () => {
  test('getDerivedStateFromError returns hasError state', () => {
    const error = new Error('Test error');
    const state = ErrorBoundary.getDerivedStateFromError(error);
    expect(state).toEqual({ hasError: true, error });
  });

  test('initial state has no error', () => {
    const instance = new ErrorBoundary({});
    expect(instance.state.hasError).toBe(false);
    expect(instance.state.error).toBeNull();
  });

  test('handleReset clears error state', () => {
    const instance = new ErrorBoundary({});
    instance.setState = jest.fn();
    instance.state = { hasError: true, error: new Error('test') };
    instance.handleReset();
    expect(instance.setState).toHaveBeenCalledWith({ hasError: false, error: null });
  });
});
