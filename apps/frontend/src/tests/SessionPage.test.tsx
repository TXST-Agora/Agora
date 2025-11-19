import { render, screen, fireEvent } from '@testing-library/react';
import SessionPage from '../components/SessionPage';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe("SessionPage", () => {

    it('renders session page with FAB', () => {
        render(<SessionPage />);
        expect(screen.getByLabelText(/Open actions/i)).toBeInTheDocument();
    });

    it('opens Ask/Comment option when clicked', () => {
        render(<SessionPage />);
        const fabButton = screen.getByLabelText(/Open actions/i);
        fireEvent.click(fabButton);
        expect(screen.getByText(/Ask/i)).toBeVisible();
        expect(screen.getByText(/Comment/i)).toBeVisible();
    });

    //Add tests for clicking Ask and Comment buttons when implemented fully
    
})



