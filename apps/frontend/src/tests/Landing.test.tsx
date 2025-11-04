// tests/Landing.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Landing from '../components/Landing';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Landing routing', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('navigates to /join when "Join Forum" is clicked', async () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );

    const user = userEvent.setup();
    const joinButton = screen.getByRole('button', { name: /join forum/i });
    await user.click(joinButton);

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/join');
  });
});
