import { render, screen, fireEvent } from '@testing-library/react';
import SessionPage from '../components/SessionPage';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe("SessionPage", () => {

    it('renders session page with FAB and Initial text', () => {
        render(<SessionPage />);
        expect(screen.getByLabelText(/Open actions/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/initial text/i)).toBeVisible();
    });

    it('opens Ask/Comment option when clicked', () => {
        render(<SessionPage />);
        const fabButton = screen.getByLabelText(/Open actions/i);
        fireEvent.click(fabButton);
        expect(screen.getByText(/\?/i)).toBeVisible();
        expect(screen.getByText(/✎/i)).toBeVisible();
    });

    describe("Modal tests", () => {
    
        describe("Ask Modal", () => {
            it('opens Ask Modal when Ask button is clicked', () => {
                render(<SessionPage />);
                const fabButton = screen.getByLabelText(/Open actions/i);
                fireEvent.click(fabButton);
                const askButton = screen.getByText(/\?/i);
                fireEvent.click(askButton);
                expect(screen.getByLabelText(/Ask a question dialog/i)).toBeVisible();
            });

            it('shows alert when submitting with empty input', () => {
                const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
                render(<SessionPage />);
                const fabButton = screen.getByLabelText(/Open actions/i);
                fireEvent.click(fabButton);
                const askButton = screen.getByText(/\?/i);
                fireEvent.click(askButton);
                
                const submitButton = screen.getAllByText(/Submit/)[0];
                fireEvent.click(submitButton);
                
                expect(alertSpy).toHaveBeenCalledWith("Please type a response before submitting.");
                alertSpy.mockRestore();
            });

            it('closes modal when Cancel button is clicked', () => {
                render(<SessionPage />);
                const fabButton = screen.getByLabelText(/Open actions/i);
                fireEvent.click(fabButton);
                const askButton = screen.getByText(/\?/i);
                fireEvent.click(askButton);
                
                expect(screen.getByLabelText(/Ask a question dialog/i)).toBeVisible();
                
                const cancelButton = screen.getAllByText(/Cancel/)[0];
                fireEvent.click(cancelButton);
                
                expect(screen.getByLabelText(/Ask a question dialog/i)).not.toHaveClass('visible');
            });

            it('closes modal when Escape key is pressed', () => {
                render(<SessionPage />);
                const fabButton = screen.getByLabelText(/Open actions/i);
                fireEvent.click(fabButton);
                const askButton = screen.getByText(/\?/i);
                fireEvent.click(askButton);
                
                expect(screen.getByLabelText(/Ask a question dialog/i)).toBeVisible();
                
                const modal = screen.getByLabelText(/Ask a question dialog/i);
                fireEvent.keyDown(modal, { key: 'Escape' });
                
                expect(screen.getByLabelText(/Ask a question dialog/i)).not.toHaveClass('visible');
            });

            it('submits successfully with valid input', () => {
                render(<SessionPage />);
                const fabButton = screen.getByLabelText(/Open actions/i);
                fireEvent.click(fabButton);
                const askButton = screen.getByText(/\?/i);
                fireEvent.click(askButton);
                
                const textarea = screen.getByLabelText(/Type your question/i) as HTMLTextAreaElement;
                fireEvent.change(textarea, { target: { value: 'What is the answer?' } });
                
                const submitButton = screen.getAllByText(/Submit/)[0];
                fireEvent.click(submitButton);
                
                expect(screen.getByLabelText(/Ask a question dialog/i)).not.toHaveClass('visible');
                expect(textarea.value).toBe('');
            });

            it('clears input when Cancel is clicked', () => {
                render(<SessionPage />);
                const fabButton = screen.getByLabelText(/Open actions/i);
                fireEvent.click(fabButton);
                const askButton = screen.getByText(/\?/i);
                fireEvent.click(askButton);
                
                const textarea = screen.getByLabelText(/Type your question/i) as HTMLTextAreaElement;
                fireEvent.change(textarea, { target: { value: 'Some text' } });
                
                expect(textarea.value).toBe('Some text');
                
                const cancelButton = screen.getAllByText(/Cancel/)[0];
                fireEvent.click(cancelButton);
                
                expect(textarea.value).toBe('');
            });

            it('generates a new FAB question element on successful submit', () => {
                render(<SessionPage />);
                const fabButton = screen.getByLabelText(/Open actions/i);
                fireEvent.click(fabButton);
                const askButton = screen.getByText(/\?/i);
                fireEvent.click(askButton);
                
                const textarea = screen.getByLabelText(/Type your question/i) as HTMLTextAreaElement;
                fireEvent.change(textarea, { target: { value: 'What is React?' } });
                
                const submitButton = screen.getAllByText(/Submit/)[0];
                fireEvent.click(submitButton);
                
                expect(screen.getByLabelText(/submitted-question-0/i)).toBeInTheDocument();
            });

            it('generates multiple FAB question elements on multiple submits', () => {
                render(<SessionPage />);
                
                // First question
                const fabButton = screen.getByLabelText(/Open actions/i);
                fireEvent.click(fabButton);
                const askButton = screen.getByText(/\?/i);
                fireEvent.click(askButton);
                
                const textarea = screen.getByLabelText(/Type your question/i) as HTMLTextAreaElement;
                fireEvent.change(textarea, { target: { value: 'First question?' } });
                
                let submitButton = screen.getAllByText(/Submit/)[0];
                fireEvent.click(submitButton);
                
                expect(screen.getByLabelText(/submitted-question-0/i)).toBeInTheDocument();
                
                // Second question
                fireEvent.click(fabButton);
                fireEvent.click(askButton);
                
                fireEvent.change(textarea, { target: { value: 'Second question?' } });
                submitButton = screen.getAllByText(/Submit/)[0];
                fireEvent.click(submitButton);
                
                expect(screen.getByLabelText(/submitted-question-0/i)).toBeInTheDocument();
                expect(screen.getByLabelText(/submitted-question-1/i)).toBeInTheDocument();
            });
        });

        describe("Comment Modal", () => {
            it('opens Comment Modal when Comment button is clicked', () => {
                render(<SessionPage />);
                const fabButton = screen.getByLabelText(/Open actions/i);
                fireEvent.click(fabButton);
                const commentButton = screen.getByText(/✎/i);
                fireEvent.click(commentButton);
                expect(screen.getByLabelText(/Leave a comment dialog/i)).toBeVisible();
            });

            it('shows alert when submitting with empty input', () => {
                const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
                render(<SessionPage />);
                const fabButton = screen.getByLabelText(/Open actions/i);
                fireEvent.click(fabButton);
                const commentButton = screen.getByText(/✎/i);
                fireEvent.click(commentButton);
                
                const submitButton = screen.getAllByText(/Submit/)[1];
                fireEvent.click(submitButton);
                
                expect(alertSpy).toHaveBeenCalledWith("Please type a response before submitting.");
                alertSpy.mockRestore();
            });

            it('closes modal when Cancel button is clicked', () => {
                render(<SessionPage />);
                const fabButton = screen.getByLabelText(/Open actions/i);
                fireEvent.click(fabButton);
                const commentButton = screen.getByText(/✎/i);
                fireEvent.click(commentButton);
                
                expect(screen.getByLabelText(/Leave a comment dialog/i)).toBeVisible();
                
                const cancelButton = screen.getAllByText(/Cancel/)[1];
                fireEvent.click(cancelButton);
                
                expect(screen.getByLabelText(/Leave a comment dialog/i)).not.toHaveClass('visible');
            });

            it('closes modal when Escape key is pressed', () => {
                render(<SessionPage />);
                const fabButton = screen.getByLabelText(/Open actions/i);
                fireEvent.click(fabButton);
                const commentButton = screen.getByText(/✎/i);
                fireEvent.click(commentButton);
                
                expect(screen.getByLabelText(/Leave a comment dialog/i)).toBeVisible();
                
                const modal = screen.getByLabelText(/Leave a comment dialog/i);
                fireEvent.keyDown(modal, { key: 'Escape' });
                
                expect(screen.getByLabelText(/Leave a comment dialog/i)).not.toHaveClass('visible');
            });

            it('submits successfully with valid input', () => {
                render(<SessionPage />);
                const fabButton = screen.getByLabelText(/Open actions/i);
                fireEvent.click(fabButton);
                const commentButton = screen.getByText(/✎/i);
                fireEvent.click(commentButton);
                
                const textarea = screen.getByLabelText(/Type your comment/i) as HTMLTextAreaElement;
                fireEvent.change(textarea, { target: { value: 'Great question!' } });
                
                const submitButton = screen.getAllByText(/Submit/)[1];
                fireEvent.click(submitButton);
                
                expect(screen.getByLabelText(/Leave a comment dialog/i)).not.toHaveClass('visible');
                expect(textarea.value).toBe('');
            });

            it('clears input when Cancel is clicked', () => {
                render(<SessionPage />);
                const fabButton = screen.getByLabelText(/Open actions/i);
                fireEvent.click(fabButton);
                const commentButton = screen.getByText(/✎/i);
                fireEvent.click(commentButton);
                
                const textarea = screen.getByLabelText(/Type your comment/i) as HTMLTextAreaElement;
                fireEvent.change(textarea, { target: { value: 'Some comment text' } });
                
                expect(textarea.value).toBe('Some comment text');
                
                const cancelButton = screen.getAllByText(/Cancel/)[1];
                fireEvent.click(cancelButton);
                
                expect(textarea.value).toBe('');
            });

            it('trims whitespace before validation', () => {
                const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
                render(<SessionPage />);
                const fabButton = screen.getByLabelText(/Open actions/i);
                fireEvent.click(fabButton);
                const commentButton = screen.getByText(/✎/i);
                fireEvent.click(commentButton);
                
                const textarea = screen.getByLabelText(/Type your comment/i) as HTMLTextAreaElement;
                fireEvent.change(textarea, { target: { value: '   \n\t  ' } });
                
                const submitButton = screen.getAllByText(/Submit/)[1];
                fireEvent.click(submitButton);
                
                expect(alertSpy).toHaveBeenCalledWith("Please type a response before submitting.");
                alertSpy.mockRestore();
            });

            it('generates a new FAB comment element on successful submit', () => {
                render(<SessionPage />);
                const fabButton = screen.getByLabelText(/Open actions/i);
                fireEvent.click(fabButton);
                const commentButton = screen.getByText(/✎/i);
                fireEvent.click(commentButton);
                
                const textarea = screen.getByLabelText(/Type your comment/i) as HTMLTextAreaElement;
                fireEvent.change(textarea, { target: { value: 'Great explanation!' } });
                
                const submitButton = screen.getAllByText(/Submit/)[1];
                fireEvent.click(submitButton);
                
                expect(screen.getByLabelText(/submitted-comment-0/i)).toBeInTheDocument();
            });

            it('generates multiple FAB comment elements on multiple submits', () => {
                render(<SessionPage />);
                
                // First comment
                const fabButton = screen.getByLabelText(/Open actions/i);
                fireEvent.click(fabButton);
                const commentButton = screen.getByText(/✎/i);
                fireEvent.click(commentButton);
                
                const textarea = screen.getByLabelText(/Type your comment/i) as HTMLTextAreaElement;
                fireEvent.change(textarea, { target: { value: 'First comment' } });
                
                let submitButton = screen.getAllByText(/Submit/)[1];
                fireEvent.click(submitButton);
                
                expect(screen.getByLabelText(/submitted-comment-0/i)).toBeInTheDocument();
                
                // Second comment
                fireEvent.click(screen.getByLabelText(/Open actions/i));
                fireEvent.click(screen.getByText(/✎/i));
                
                fireEvent.change(textarea, { target: { value: 'Second comment' } });
                submitButton = screen.getAllByText(/Submit/)[1];
                fireEvent.click(submitButton);
                
                expect(screen.getByLabelText(/submitted-comment-0/i)).toBeInTheDocument();
                expect(screen.getByLabelText(/submitted-comment-1/i)).toBeInTheDocument();
            });

            
        });

    })

    //Add tests for clicking Ask and Comment buttons when implemented fully
    
})



