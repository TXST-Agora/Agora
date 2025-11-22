// tests/Navbar.test.tsx
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Navbar from '../components/Navbar';
import { ThemeProvider } from '../contexts/ThemeContext';

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
      <ThemeProvider>
        <Navbar />
      </ThemeProvider>
    );

    const user = userEvent.setup();
    const brand = screen.getByText(/agora/i);
    await user.click(brand);

    expect(window.location.href).toBe('/');
  });
});

describe('Navbar theme toggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('toggles between light and dark themes when clicking the theme button', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <Navbar />
      </ThemeProvider>
    );

    const toggleButton = screen.getByRole('button', { name: /switch to dark mode/i });
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('agora-theme')).toBe('light');

    await user.click(toggleButton);

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('agora-theme')).toBe('dark');
    expect(toggleButton).toHaveAccessibleName(/switch to light mode/i);
  });
});