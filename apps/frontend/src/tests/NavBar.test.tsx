// tests/Navbar.test.tsx
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../components/Navbar';

describe('Navbar routing', () => {
  let originalLocation: Location;
  let mockHref: string;

  beforeEach(() => {
    originalLocation = window.location;
    mockHref = '';
    // Mock window.location.href
    Object.defineProperty(window, 'location', {
      value: {
        ...originalLocation,
        get href() {
          return mockHref;
        },
        set href(value: string) {
          mockHref = value;
        },
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });

  it('sets window.location.href to / when Agora is clicked', async () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    const user = userEvent.setup();
    const brand = screen.getByText(/agora/i);
    await user.click(brand);

    expect(window.location.href).toBe('/');
  });
});