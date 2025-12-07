import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import JoinPage from '../components/JoinPage';

describe('JoinPage', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    mockNavigate.mockClear();
    globalThis.fetch = vi.fn() as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('renders heading, input, and submit button', () => {
    render(
      <MemoryRouter>
        <JoinPage />
      </MemoryRouter>
    );

    expect(
      screen.getByText(/enter session code/i)
    ).toBeInTheDocument();

    expect(screen.getByLabelText(/six digit code/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /verify/i })).toBeInTheDocument();
  });

  it('sanitizes input to uppercase letters, digits only, and max length 6; clears prior messages on change', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <JoinPage />
      </MemoryRouter>
    );

    const input = screen.getByLabelText(/six digit code/i) as HTMLInputElement;
    const submit = screen.getByRole('button', { name: /verify/i });

    // First, trigger an error so we can verify it clears on change
    await user.click(submit);
    const err = screen.getByRole('alert');
    expect(err).toHaveTextContent(/please enter exactly 6 characters/i);

    // Now type mixed characters; component should keep only digits and slice to 6
    await user.clear(input);
    await user.type(input, '12a!3456'); // -> "123456"
    expect(input.value).toBe('12A345');

    // Error message should be cleared after input change
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows an error when submitting with an invalid (short) code', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <JoinPage />
      </MemoryRouter>
    );

    const input = screen.getByLabelText(/six digit code/i);
    await user.type(input, '123'); // too short
    await user.click(screen.getByRole('button', { name: /verify/i }));

    const err = screen.getByRole('alert');
    expect(err).toHaveTextContent(/please enter exactly 6 characters/i);

    // No confirmation/status message when invalid
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows "Verifying..." for a valid code, then navigates to session page on success', async () => {
    const user = userEvent.setup();
    let resolveFetch: (value: Response) => void;
    const fetchPromise = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(fetchPromise);

    render(
      <MemoryRouter>
        <JoinPage />
      </MemoryRouter>
    );

    const input = screen.getByLabelText(/six digit code/i);
    await user.type(input, '123456');
    await user.click(screen.getByRole('button', { name: /verify/i }));

    // Wait for button to show "Verifying..." and be disabled
    await waitFor(() => {
      const button = screen.getByRole('button', { name: /verifying/i });
      expect(button).toBeDisabled();
    });
    
    // Confirmation/status should appear
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/verifying/i);
    });

    // Verify the API call was made
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/session/123456')
    );

    // Resolve the fetch to trigger navigation
    resolveFetch!({
      ok: true,
      status: 200,
    } as Response);

    // Should navigate to session page
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/forum/123456');
    });
  });

  it('shows error message when session is not found (404)', async () => {
    const user = userEvent.setup();
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    render(
      <MemoryRouter>
        <JoinPage />
      </MemoryRouter>
    );

    const input = screen.getByLabelText(/six digit code/i);
    await user.type(input, '123456');
    await user.click(screen.getByRole('button', { name: /verify/i }));

    // Wait for the API call to complete
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/session/123456')
      );
    });

    // Should show error message
    await waitFor(() => {
      const error = screen.getByRole('alert');
      expect(error).toHaveTextContent(/session not found/i);
    });

    // Should not navigate
    expect(mockNavigate).not.toHaveBeenCalled();

    // Button should be enabled again
    expect(screen.getByRole('button', { name: /verify/i })).not.toBeDisabled();
  });

  it('shows error message on network or other API errors', async () => {
    const user = userEvent.setup();
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(
      <MemoryRouter>
        <JoinPage />
      </MemoryRouter>
    );

    const input = screen.getByLabelText(/six digit code/i);
    await user.type(input, '123456');
    await user.click(screen.getByRole('button', { name: /verify/i }));

    // Wait for the API call to complete
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalled();
    });

    // Should show error message
    await waitFor(() => {
      const error = screen.getByRole('alert');
      expect(error).toHaveTextContent(/failed to verify session/i);
    });

    // Should not navigate
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows error message when fetch throws an error', async () => {
    const user = userEvent.setup();
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Network error')
    );

    render(
      <MemoryRouter>
        <JoinPage />
      </MemoryRouter>
    );

    const input = screen.getByLabelText(/six digit code/i);
    await user.type(input, '123456');
    await user.click(screen.getByRole('button', { name: /verify/i }));

    // Wait for the error to be handled
    await waitFor(() => {
      const error = screen.getByRole('alert');
      expect(error).toHaveTextContent(/failed to verify session/i);
    });

    // Should not navigate
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});