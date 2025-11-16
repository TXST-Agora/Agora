import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JoinPage from '../components/JoinPage';
import { act } from 'react';

describe('JoinPage', () => {
  it('renders heading, input, and submit button', () => {
    render(<JoinPage />);

    expect(
      screen.getByText(/enter session code/i)
    ).toBeInTheDocument();

    expect(screen.getByLabelText(/six digit code/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /verify/i })).toBeInTheDocument();
  });

  it('sanitizes input to uppercase letters, digits only, and max length 6; clears prior messages on change', async () => {
    const user = userEvent.setup();
    render(<JoinPage />);

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
    render(<JoinPage />);

    const input = screen.getByLabelText(/six digit code/i);
    await user.type(input, '123'); // too short
    await user.click(screen.getByRole('button', { name: /verify/i }));

    const err = screen.getByRole('alert');
    expect(err).toHaveTextContent(/please enter exactly 6 characters/i);

    // No confirmation/status message when invalid
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows "Submitting..." for a valid code, then alerts and clears the status after 600ms', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    const user = userEvent.setup();
    render(<JoinPage />);

    const input = screen.getByLabelText(/six digit code/i);
    await user.type(input, '123456');
    await user.click(screen.getByRole('button', { name: /verify/i }));

    // Confirmation/status should appear
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent(/submitting/i);

    // Wait for the setTimeout to fire
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 650));
    });

    expect(alertSpy).toHaveBeenCalledWith('Code verified: 123456');

    // Status message should be cleared
    const msgContainer = screen.getByRole('region', { name: /enter session code/i });
    expect(within(msgContainer).queryByText(/submitting/i)).not.toBeInTheDocument();

    alertSpy.mockRestore();
  });
});