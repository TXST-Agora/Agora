import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

// Mock useParams before importing SessionPage
const mockSessionCode = "TEST12";
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useParams: () => ({ sessionCode: mockSessionCode }),
    };
});

import SessionPage from '../components/SessionPage';

describe("SessionPage", () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchMock = vi.fn();
        (globalThis as any).fetch = fetchMock;
        
        // Mock GET session endpoint
        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                sessionCode: mockSessionCode,
                title: "Test Session",
                description: "Test Description",
                mode: "normal",
                hostStartTime: new Date().toISOString(),
                actions: []
            }),
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const renderWithRouter = () => {
        return render(
            <MemoryRouter>
                <SessionPage />
            </MemoryRouter>
        );
    };

    it('renders session page with FAB and Initial text', async () => {
        renderWithRouter();
        await waitFor(() => {
            expect(screen.getByLabelText(/Open actions/i)).toBeInTheDocument();
        });
        expect(screen.getByLabelText(/initial text/i)).toBeVisible();
    });

    it('opens Ask/Comment option when clicked', async () => {
        renderWithRouter();
        await waitFor(() => {
            expect(screen.getByLabelText(/Open actions/i)).toBeInTheDocument();
        });
        const fabButton = screen.getByLabelText(/Open actions/i);
        fireEvent.click(fabButton);
        expect(screen.getByText(/\?/i)).toBeVisible();
        expect(screen.getByText(/✎/i)).toBeVisible();
    });

    describe("Modal tests", () => {
    
        describe("Ask Modal", () => {
            it('opens Ask Modal when Ask button is clicked', async () => {
                renderWithRouter();
                await waitFor(() => {
                    expect(screen.getByLabelText(/Open actions/i)).toBeInTheDocument();
                });
                const fabButton = screen.getByLabelText(/Open actions/i);
                fireEvent.click(fabButton);
                const askButton = screen.getByText(/\?/i);
                fireEvent.click(askButton);
                expect(screen.getByLabelText(/Ask a question dialog/i)).toBeVisible();
            });

            it('shows alert when submitting with empty input', async () => {
                const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
                renderWithRouter();
                await waitFor(() => {
                    expect(screen.getByLabelText(/Open actions/i)).toBeInTheDocument();
                });
                const fabButton = screen.getByLabelText(/Open actions/i);
                fireEvent.click(fabButton);
                const askButton = screen.getByText(/\?/i);
                fireEvent.click(askButton);
                
                const submitButton = screen.getAllByText(/Submit/)[0];
                fireEvent.click(submitButton);
                
                expect(alertSpy).toHaveBeenCalledWith("Please type a response before submitting.");
                alertSpy.mockRestore();
            });

            it('closes modal when Cancel button is clicked', async () => {
                renderWithRouter();
                await waitFor(() => {
                    expect(screen.getByLabelText(/Open actions/i)).toBeInTheDocument();
                });
                const fabButton = screen.getByLabelText(/Open actions/i);
                fireEvent.click(fabButton);
                const askButton = screen.getByText(/\?/i);
                fireEvent.click(askButton);
                
                expect(screen.getByLabelText(/Ask a question dialog/i)).toBeVisible();
                
                const cancelButton = screen.getAllByText(/Cancel/)[0];
                fireEvent.click(cancelButton);
                
                expect(screen.getByLabelText(/Ask a question dialog/i)).not.toHaveClass('visible');
            });

            it('closes modal when Escape key is pressed', async () => {
                renderWithRouter();
                await waitFor(() => {
                    expect(screen.getByLabelText(/Open actions/i)).toBeInTheDocument();
                });
                const fabButton = screen.getByLabelText(/Open actions/i);
                fireEvent.click(fabButton);
                const askButton = screen.getByText(/\?/i);
                fireEvent.click(askButton);
                
                expect(screen.getByLabelText(/Ask a question dialog/i)).toBeVisible();
                
                const modal = screen.getByLabelText(/Ask a question dialog/i);
                fireEvent.keyDown(modal, { key: 'Escape' });
                
                expect(screen.getByLabelText(/Ask a question dialog/i)).not.toHaveClass('visible');
            });

            it('submits successfully with valid input', async () => {
                // Mock POST action endpoint
                fetchMock.mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        message: "Action added",
                        action: {
                            id: 'test-id',
                            actionID: 1,
                            type: 'question',
                            content: 'What is the answer?',
                            start_time: new Date().toISOString()
                        }
                    }),
                });

                renderWithRouter();
                await waitFor(() => {
                    expect(screen.getByLabelText(/Open actions/i)).toBeInTheDocument();
                });
                const fabButton = screen.getByLabelText(/Open actions/i);
                fireEvent.click(fabButton);
                const askButton = screen.getByText(/\?/i);
                fireEvent.click(askButton);
                
                const textarea = screen.getByLabelText(/Type your question/i) as HTMLTextAreaElement;
                fireEvent.change(textarea, { target: { value: 'What is the answer?' } });
                
                const submitButton = screen.getAllByText(/Submit/)[0];
                await fireEvent.click(submitButton);
                
                await waitFor(() => {
                    expect(fetchMock).toHaveBeenCalledWith(
                        expect.stringContaining(`/api/session/${mockSessionCode}/action`),
                        expect.objectContaining({
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                type: 'question',
                                content: 'What is the answer?',
                                actionID: 1,
                            }),
                        })
                    );
                });
                
                await waitFor(() => {
                    expect(screen.getByLabelText(/Ask a question dialog/i)).not.toHaveClass('visible');
                });
            });

            it('clears input when Cancel is clicked', async () => {
                renderWithRouter();
                await waitFor(() => {
                    expect(screen.getByLabelText(/Open actions/i)).toBeInTheDocument();
                });
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

            it('generates a new FAB question element on successful submit', async () => {
                // Mock POST action endpoint
                fetchMock.mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        message: "Action added",
                        action: {
                            id: 'test-id',
                            actionID: 1,
                            type: 'question',
                            content: 'What is React?',
                            start_time: new Date().toISOString()
                        }
                    }),
                });

                renderWithRouter();
                await waitFor(() => {
                    expect(screen.getByLabelText(/Open actions/i)).toBeInTheDocument();
                });
                const fabButton = screen.getByLabelText(/Open actions/i);
                fireEvent.click(fabButton);
                const askButton = screen.getByText(/\?/i);
                fireEvent.click(askButton);
                
                const textarea = screen.getByLabelText(/Type your question/i) as HTMLTextAreaElement;
                fireEvent.change(textarea, { target: { value: 'What is React?' } });
                
                const submitButton = screen.getAllByText(/Submit/)[0];
                await fireEvent.click(submitButton);
                
                await waitFor(() => {
                    const element = screen.getByLabelText(/submitted-question-1/i);
                    expect(element).toBeInTheDocument();
                    expect(element).toHaveAttribute('id', '1');
                });
            });

            it('generates multiple FAB question elements on multiple submits', async () => {
                // Mock POST action endpoints for both submissions
                fetchMock
                    .mockResolvedValueOnce({
                        ok: true,
                        json: async () => ({
                            message: "Action added",
                            action: {
                                id: 'test-id-1',
                                actionID: 1,
                                type: 'question',
                                content: 'First question?',
                                start_time: new Date().toISOString()
                            }
                        }),
                    })
                    .mockResolvedValueOnce({
                        ok: true,
                        json: async () => ({
                            message: "Action added",
                            action: {
                                id: 'test-id-2',
                                actionID: 2,
                                type: 'question',
                                content: 'Second question?',
                                start_time: new Date().toISOString()
                            }
                        }),
                    });

                renderWithRouter();
                await waitFor(() => {
                    expect(screen.getByLabelText(/Open actions/i)).toBeInTheDocument();
                });
                
                // First question
                const fabButton = screen.getByLabelText(/Open actions/i);
                fireEvent.click(fabButton);
                const askButton = screen.getByText(/\?/i);
                fireEvent.click(askButton);
                
                const textarea = screen.getByLabelText(/Type your question/i) as HTMLTextAreaElement;
                fireEvent.change(textarea, { target: { value: 'First question?' } });
                
                let submitButton = screen.getAllByText(/Submit/)[0];
                await fireEvent.click(submitButton);
                
                await waitFor(() => {
                    const element1 = screen.getByLabelText(/submitted-question-1/i);
                    expect(element1).toBeInTheDocument();
                    expect(element1).toHaveAttribute('id', '1');
                });
                
                // Second question
                fireEvent.click(fabButton);
                fireEvent.click(askButton);
                
                fireEvent.change(textarea, { target: { value: 'Second question?' } });
                submitButton = screen.getAllByText(/Submit/)[0];
                await fireEvent.click(submitButton);
                
                await waitFor(() => {
                    const element1 = screen.getByLabelText(/submitted-question-1/i);
                    const element2 = screen.getByLabelText(/submitted-question-2/i);
                    expect(element1).toBeInTheDocument();
                    expect(element1).toHaveAttribute('id', '1');
                    expect(element2).toBeInTheDocument();
                    expect(element2).toHaveAttribute('id', '2');
                });
            });
        });

        describe("Comment Modal", () => {
            it('opens Comment Modal when Comment button is clicked', async () => {
                renderWithRouter();
                await waitFor(() => {
                    expect(screen.getByLabelText(/Open actions/i)).toBeInTheDocument();
                });
                const fabButton = screen.getByLabelText(/Open actions/i);
                fireEvent.click(fabButton);
                const commentButton = screen.getByText(/✎/i);
                fireEvent.click(commentButton);
                expect(screen.getByLabelText(/Leave a comment dialog/i)).toBeVisible();
            });

            it('shows alert when submitting with empty input', async () => {
                const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
                renderWithRouter();
                await waitFor(() => {
                    expect(screen.getByLabelText(/Open actions/i)).toBeInTheDocument();
                });
                const fabButton = screen.getByLabelText(/Open actions/i);
                fireEvent.click(fabButton);
                const commentButton = screen.getByText(/✎/i);
                fireEvent.click(commentButton);
                
                const submitButton = screen.getAllByText(/Submit/)[1];
                fireEvent.click(submitButton);
                
                expect(alertSpy).toHaveBeenCalledWith("Please type a response before submitting.");
                alertSpy.mockRestore();
            });

            it('closes modal when Cancel button is clicked', async () => {
                renderWithRouter();
                await waitFor(() => {
                    expect(screen.getByLabelText(/Open actions/i)).toBeInTheDocument();
                });
                const fabButton = screen.getByLabelText(/Open actions/i);
                fireEvent.click(fabButton);
                const commentButton = screen.getByText(/✎/i);
                fireEvent.click(commentButton);
                
                expect(screen.getByLabelText(/Leave a comment dialog/i)).toBeVisible();
                
                const cancelButton = screen.getAllByText(/Cancel/)[1];
                fireEvent.click(cancelButton);
                
                expect(screen.getByLabelText(/Leave a comment dialog/i)).not.toHaveClass('visible');
            });

            it('closes modal when Escape key is pressed', async () => {
                renderWithRouter();
                await waitFor(() => {
                    expect(screen.getByLabelText(/Open actions/i)).toBeInTheDocument();
                });
                const fabButton = screen.getByLabelText(/Open actions/i);
                fireEvent.click(fabButton);
                const commentButton = screen.getByText(/✎/i);
                fireEvent.click(commentButton);
                
                expect(screen.getByLabelText(/Leave a comment dialog/i)).toBeVisible();
                
                const modal = screen.getByLabelText(/Leave a comment dialog/i);
                fireEvent.keyDown(modal, { key: 'Escape' });
                
                expect(screen.getByLabelText(/Leave a comment dialog/i)).not.toHaveClass('visible');
            });

            it('submits successfully with valid input', async () => {
                // Mock POST action endpoint
                fetchMock.mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        message: "Action added",
                        action: {
                            id: 'test-id',
                            actionID: 1,
                            type: 'comment',
                            content: 'Great question!',
                            start_time: new Date().toISOString()
                        }
                    }),
                });

                renderWithRouter();
                await waitFor(() => {
                    expect(screen.getByLabelText(/Open actions/i)).toBeInTheDocument();
                });
                const fabButton = screen.getByLabelText(/Open actions/i);
                fireEvent.click(fabButton);
                const commentButton = screen.getByText(/✎/i);
                fireEvent.click(commentButton);
                
                const textarea = screen.getByLabelText(/Type your comment/i) as HTMLTextAreaElement;
                fireEvent.change(textarea, { target: { value: 'Great question!' } });
                
                const submitButton = screen.getAllByText(/Submit/)[1];
                await fireEvent.click(submitButton);
                
                await waitFor(() => {
                    expect(fetchMock).toHaveBeenCalledWith(
                        expect.stringContaining(`/api/session/${mockSessionCode}/action`),
                        expect.objectContaining({
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                type: 'comment',
                                content: 'Great question!',
                                actionID: 1,
                            }),
                        })
                    );
                });
                
                await waitFor(() => {
                    expect(screen.getByLabelText(/Leave a comment dialog/i)).not.toHaveClass('visible');
                });
            });

            it('clears input when Cancel is clicked', async () => {
                renderWithRouter();
                await waitFor(() => {
                    expect(screen.getByLabelText(/Open actions/i)).toBeInTheDocument();
                });
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

            it('trims whitespace before validation', async () => {
                const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
                renderWithRouter();
                await waitFor(() => {
                    expect(screen.getByLabelText(/Open actions/i)).toBeInTheDocument();
                });
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

            it('generates a new FAB comment element on successful submit', async () => {
                // Mock POST action endpoint
                fetchMock.mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        message: "Action added",
                        action: {
                            id: 'test-id',
                            actionID: 1,
                            type: 'comment',
                            content: 'Great explanation!',
                            start_time: new Date().toISOString()
                        }
                    }),
                });

                renderWithRouter();
                await waitFor(() => {
                    expect(screen.getByLabelText(/Open actions/i)).toBeInTheDocument();
                });
                const fabButton = screen.getByLabelText(/Open actions/i);
                fireEvent.click(fabButton);
                const commentButton = screen.getByText(/✎/i);
                fireEvent.click(commentButton);
                
                const textarea = screen.getByLabelText(/Type your comment/i) as HTMLTextAreaElement;
                fireEvent.change(textarea, { target: { value: 'Great explanation!' } });
                
                const submitButton = screen.getAllByText(/Submit/)[1];
                await fireEvent.click(submitButton);
                
                await waitFor(() => {
                    const element = screen.getByLabelText(/submitted-comment-1/i);
                    expect(element).toBeInTheDocument();
                    expect(element).toHaveAttribute('id', '1');
                });
            });

            it('generates multiple FAB comment elements on multiple submits', async () => {
                // Mock POST action endpoints for both submissions
                fetchMock
                    .mockResolvedValueOnce({
                        ok: true,
                        json: async () => ({
                            message: "Action added",
                            action: {
                                id: 'test-id-1',
                                actionID: 1,
                                type: 'comment',
                                content: 'First comment',
                                start_time: new Date().toISOString()
                            }
                        }),
                    })
                    .mockResolvedValueOnce({
                        ok: true,
                        json: async () => ({
                            message: "Action added",
                            action: {
                                id: 'test-id-2',
                                actionID: 2,
                                type: 'comment',
                                content: 'Second comment',
                                start_time: new Date().toISOString()
                            }
                        }),
                    });

                renderWithRouter();
                await waitFor(() => {
                    expect(screen.getByLabelText(/Open actions/i)).toBeInTheDocument();
                });
                
                // First comment
                const fabButton = screen.getByLabelText(/Open actions/i);
                fireEvent.click(fabButton);
                const commentButton = screen.getByText(/✎/i);
                fireEvent.click(commentButton);
                
                const textarea = screen.getByLabelText(/Type your comment/i) as HTMLTextAreaElement;
                fireEvent.change(textarea, { target: { value: 'First comment' } });
                
                let submitButton = screen.getAllByText(/Submit/)[1];
                await fireEvent.click(submitButton);
                
                await waitFor(() => {
                    const element1 = screen.getByLabelText(/submitted-comment-1/i);
                    expect(element1).toBeInTheDocument();
                    expect(element1).toHaveAttribute('id', '1');
                });
                
                // Second comment
                fireEvent.click(screen.getByLabelText(/Open actions/i));
                fireEvent.click(screen.getByText(/✎/i));
                
                fireEvent.change(textarea, { target: { value: 'Second comment' } });
                submitButton = screen.getAllByText(/Submit/)[1];
                await fireEvent.click(submitButton);
                
                await waitFor(() => {
                    const element1 = screen.getByLabelText(/submitted-comment-1/i);
                    const element2 = screen.getByLabelText(/submitted-comment-2/i);
                    expect(element1).toBeInTheDocument();
                    expect(element1).toHaveAttribute('id', '1');
                    expect(element2).toBeInTheDocument();
                    expect(element2).toHaveAttribute('id', '2');
                });
            });

            
        });

    })

    //Add tests for clicking Ask and Comment buttons when implemented fully
    
})



