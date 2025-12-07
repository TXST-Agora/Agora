import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../components/Navbar';

describe('Navbar theme toggle', () => {
  beforeEach(() => {
    // Clear localStorage and body class before each test
    localStorage.clear();
    document.body.classList.remove('dark');
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
    document.body.classList.remove('dark');
  });

  it('toggles theme from light to dark when clicked', async () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    const user = userEvent.setup();
    const themeToggle = screen.getByRole('button', { name: /switch to dark mode/i });

    // Initially should be light mode
    expect(document.body.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');

    // Click the toggle
    await user.click(themeToggle);

    // Should now be dark mode
    expect(document.body.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('toggles theme from dark to light when clicked', async () => {
    // Start in dark mode
    document.body.classList.add('dark');
    localStorage.setItem('theme', 'dark');

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    const user = userEvent.setup();
    const themeToggle = screen.getByRole('button', { name: /switch to light mode/i });

    // Initially should be dark mode
    expect(document.body.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');

    // Click the toggle
    await user.click(themeToggle);

    // Should now be light mode
    expect(document.body.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');
  });
});
