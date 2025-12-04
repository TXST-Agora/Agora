import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
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
  beforeEach(() => {
    mockNavigate.mockClear();
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

  it('shows "Verifying..." for a valid code, then navigates to session page', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <JoinPage />
      </MemoryRouter>
    );

    const input = screen.getByLabelText(/six digit code/i);
    await user.type(input, '123456');
    await user.click(screen.getByRole('button', { name: /verify/i }));

    // Confirmation/status should appear
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent(/verifying/i);

    // Wait for the setTimeout to fire
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 650));
    });

    // Should navigate to session page
    expect(mockNavigate).toHaveBeenCalledWith('/forum/123456');

    // Status message should be cleared
    const msgContainer = screen.getByRole('region', { name: /enter session code/i });
    expect(within(msgContainer).queryByText(/verifying/i)).not.toBeInTheDocument();
  });
});