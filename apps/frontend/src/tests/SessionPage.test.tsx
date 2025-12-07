import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
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

            it('shows validation error when submitting with empty input', async () => {
                renderWithRouter();
                await waitFor(() => {
                    expect(screen.getByLabelText(/Open actions/i)).toBeInTheDocument();
                });
                const fabButton = screen.getByLabelText(/Open actions/i);
                fireEvent.click(fabButton);
                const askButton = screen.getByText(/\?/i);
                fireEvent.click(askButton);
                
                const askModal = screen.getByLabelText(/Ask a question dialog/i);
                const submitButton = within(askModal).getByText(/Submit/);
                fireEvent.click(submitButton);
                
                await waitFor(() => {
                    expect(within(askModal).getByText("Please type a response before submitting.")).toBeInTheDocument();
                });
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

            it('generates multiple FAB question elements on multiple successful submits', async () => {
                const questions = [
                    { id: 'test-id-1', actionID: 1, content: 'What is React?' },
                    { id: 'test-id-2', actionID: 2, content: 'How does TypeScript work?' },
                    { id: 'test-id-3', actionID: 3, content: 'What is the difference between let and const?' }
                ];

                // Track submitted action IDs for /actions/times responses
                const submittedActionIDs = new Set<number>();
                
                // Store POST mock responses
                const postResponses = questions.map((question) => ({
                    ok: true,
                    json: async () => {
                        submittedActionIDs.add(question.actionID);
                        return {
                            message: "Action added",
                            action: {
                                id: question.id,
                                actionID: question.actionID,
                                type: 'question',
                                content: question.content,
                                start_time: new Date().toISOString()
                            }
                        };
                    },
                }));
                
                let postIndex = 0;
                let hasUsedInitialSessionMock = false;
                
                // Use mockImplementation to handle both POST and GET requests
                fetchMock.mockImplementation((url: string | Request | URL, init?: RequestInit) => {
                    const urlString = typeof url === 'string' ? url : url.toString();
                    const isPost = init?.method === 'POST';
                    
                    // Handle /actions/times GET requests
                    if (urlString.includes('/actions/times')) {
                        return Promise.resolve({
                            ok: true,
                            json: async () => ({
                                actions: Array.from(submittedActionIDs).map(actionID => ({
                                    actionID,
                                    timeMargin: 0,
                                    color: undefined
                                }))
                            }),
                        });
                    }
                    
                    // Handle POST /action requests
                    if (isPost && urlString.includes('/action') && postIndex < postResponses.length) {
                        return Promise.resolve(postResponses[postIndex++]);
                    }
                    
                    // Handle initial GET /session request (from beforeEach)
                    if (!hasUsedInitialSessionMock && urlString.includes(`/session/${mockSessionCode}`) && !isPost && !urlString.includes('/action')) {
                        hasUsedInitialSessionMock = true;
                        // This will be handled by the mockResolvedValueOnce from beforeEach
                        // But since we're using mockImplementation, we need to handle it here
                        return Promise.resolve({
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
                    }
                    
                    return Promise.reject(new Error(`Unexpected fetch: ${urlString}, method: ${init?.method || 'GET'}`));
                });

                const { container } = renderWithRouter();
                
                // Set up container dimensions so positioning logic works
                const sessionPage = container.querySelector('.session-page') as HTMLElement;
                if (sessionPage) {
                    Object.defineProperty(sessionPage, 'offsetWidth', { value: 1920, configurable: true });
                    Object.defineProperty(sessionPage, 'offsetHeight', { value: 1080, configurable: true });
                    Object.defineProperty(sessionPage, 'getBoundingClientRect', {
                        value: () => ({
                            width: 1920,
                            height: 1080,
                            top: 0,
                            left: 0,
                            bottom: 1080,
                            right: 1920,
                            x: 0,
                            y: 0,
                            toJSON: () => {}
                        }),
                        configurable: true
                    });
                }

                await waitFor(() => {
                    expect(screen.getByLabelText(/Open actions/i)).toBeInTheDocument();
                });

                // Submit each question
                for (let i = 0; i < questions.length; i++) {
                    const question = questions[i];
                    
                    // Open FAB
                    const fabButton = screen.getByLabelText(/Open actions/i);
                    fireEvent.click(fabButton);
                    
                    // Click Ask button - need to find the one in fab-options, not the submitted FABs or modal
                    // Find all "Ask" texts and get the one inside the fab-option button
                    const askTexts = screen.getAllByText(/Ask/i);
                    const askButton = askTexts
                        .map(text => text.closest('button.fab-option'))
                        .find(btn => btn !== null) as HTMLButtonElement | undefined;
                    if (!askButton) {
                        throw new Error('Ask button not found');
                    }
                    fireEvent.click(askButton);
                    
                    // Wait for modal to be visible
                    await waitFor(() => {
                        expect(screen.getByLabelText(/Ask a question dialog/i)).toBeVisible();
                    });
                    
                    // Type question
                    const textarea = screen.getByLabelText(/Type your question/i) as HTMLTextAreaElement;
                    fireEvent.change(textarea, { target: { value: question.content } });
                    
                    // Submit
                    const submitButton = screen.getAllByText(/Submit/)[0];
                    await act(async () => {
                        fireEvent.click(submitButton);
                    });
                    
                    // Wait for modal to close
                    await waitFor(() => {
                        expect(screen.getByLabelText(/Ask a question dialog/i)).not.toHaveClass('visible');
                    });
                    
                    // Wait for the element to appear
                    await waitFor(() => {
                        const element = screen.getByLabelText(new RegExp(`submitted-question-${question.actionID}`, 'i'));
                        expect(element).toBeInTheDocument();
                        expect(element).toHaveAttribute('id', String(question.actionID));
                    }, { timeout: 3000 });
                }

                // Verify all questions are present
                questions.forEach((question) => {
                    const element = screen.getByLabelText(new RegExp(`submitted-question-${question.actionID}`, 'i'));
                    expect(element).toBeInTheDocument();
                    expect(element).toHaveAttribute('id', String(question.actionID));
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

            it('shows validation error when submitting with empty input', async () => {
                renderWithRouter();
                await waitFor(() => {
                    expect(screen.getByLabelText(/Open actions/i)).toBeInTheDocument();
                });
                const fabButton = screen.getByLabelText(/Open actions/i);
                fireEvent.click(fabButton);
                const commentButton = screen.getByText(/✎/i);
                fireEvent.click(commentButton);
                
                const commentModal = screen.getByLabelText(/Leave a comment dialog/i);
                const submitButton = within(commentModal).getByText(/Submit/);
                fireEvent.click(submitButton);
                
                await waitFor(() => {
                    expect(within(commentModal).getByText("Please type a response before submitting.")).toBeInTheDocument();
                });
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
                renderWithRouter();
                await waitFor(() => {
                    expect(screen.getByLabelText(/Open actions/i)).toBeInTheDocument();
                });
                const fabButton = screen.getByLabelText(/Open actions/i);
                fireEvent.click(fabButton);
                const commentButton = screen.getByText(/✎/i);
                fireEvent.click(commentButton);
                
                const commentModal = screen.getByLabelText(/Leave a comment dialog/i);
                const textarea = within(commentModal).getByLabelText(/Type your comment/i) as HTMLTextAreaElement;
                fireEvent.change(textarea, { target: { value: '   \n\t  ' } });
                
                const submitButton = within(commentModal).getByText(/Submit/);
                fireEvent.click(submitButton);
                
                await waitFor(() => {
                    expect(within(commentModal).getByText("Please type a response before submitting.")).toBeInTheDocument();
                });
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

            it('generates multiple FAB comment elements on multiple successful submits', async () => {
                const comments = [
                    { id: 'test-id-1', actionID: 1, content: 'Great explanation!' },
                    { id: 'test-id-2', actionID: 2, content: 'This is very helpful.' },
                    { id: 'test-id-3', actionID: 3, content: 'I have a follow-up question.' }
                ];

                // Track submitted action IDs for /actions/times responses
                const submittedActionIDs = new Set<number>();
                
                // Store POST mock responses
                const postResponses = comments.map((comment) => ({
                    ok: true,
                    json: async () => {
                        submittedActionIDs.add(comment.actionID);
                        return {
                            message: "Action added",
                            action: {
                                id: comment.id,
                                actionID: comment.actionID,
                                type: 'comment',
                                content: comment.content,
                                start_time: new Date().toISOString()
                            }
                        };
                    },
                }));
                
                let postIndex = 0;
                let hasUsedInitialSessionMock = false;
                
                // Use mockImplementation to handle both POST and GET requests
                fetchMock.mockImplementation((url: string | Request | URL, init?: RequestInit) => {
                    const urlString = typeof url === 'string' ? url : url.toString();
                    const isPost = init?.method === 'POST';
                    
                    // Handle /actions/times GET requests
                    if (urlString.includes('/actions/times')) {
                        return Promise.resolve({
                            ok: true,
                            json: async () => ({
                                actions: Array.from(submittedActionIDs).map(actionID => ({
                                    actionID,
                                    timeMargin: 0,
                                    color: undefined
                                }))
                            }),
                        });
                    }
                    
                    // Handle POST /action requests
                    if (isPost && urlString.includes('/action') && postIndex < postResponses.length) {
                        return Promise.resolve(postResponses[postIndex++]);
                    }
                    
                    // Handle initial GET /session request (from beforeEach)
                    if (!hasUsedInitialSessionMock && urlString.includes(`/session/${mockSessionCode}`) && !isPost && !urlString.includes('/action')) {
                        hasUsedInitialSessionMock = true;
                        return Promise.resolve({
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
                    }
                    
                    return Promise.reject(new Error(`Unexpected fetch: ${urlString}, method: ${init?.method || 'GET'}`));
                });

                const { container } = renderWithRouter();
                
                // Set up container dimensions so positioning logic works
                const sessionPage = container.querySelector('.session-page') as HTMLElement;
                if (sessionPage) {
                    Object.defineProperty(sessionPage, 'offsetWidth', { value: 1920, configurable: true });
                    Object.defineProperty(sessionPage, 'offsetHeight', { value: 1080, configurable: true });
                    Object.defineProperty(sessionPage, 'getBoundingClientRect', {
                        value: () => ({
                            width: 1920,
                            height: 1080,
                            top: 0,
                            left: 0,
                            bottom: 1080,
                            right: 1920,
                            x: 0,
                            y: 0,
                            toJSON: () => {}
                        }),
                        configurable: true
                    });
                }

                await waitFor(() => {
                    expect(screen.getByLabelText(/Open actions/i)).toBeInTheDocument();
                });

                // Submit each comment
                for (let i = 0; i < comments.length; i++) {
                    const comment = comments[i];
                    
                    // Open FAB
                    const fabButton = screen.getByLabelText(/Open actions/i);
                    fireEvent.click(fabButton);
                    
                    // Click Comment button - need to find the one in fab-options, not the submitted FABs or modal
                    // Find all "Comment" texts and get the one inside the fab-option button
                    const commentTexts = screen.getAllByText(/Comment/i);
                    const commentButton = commentTexts
                        .map(text => text.closest('button.fab-option'))
                        .find(btn => btn !== null) as HTMLButtonElement | undefined;
                    if (!commentButton) {
                        throw new Error('Comment button not found');
                    }
                    fireEvent.click(commentButton);
                    
                    // Wait for modal to be visible
                    await waitFor(() => {
                        expect(screen.getByLabelText(/Leave a comment dialog/i)).toBeVisible();
                    });
                    
                    // Type comment
                    const textarea = screen.getByLabelText(/Type your comment/i) as HTMLTextAreaElement;
                    fireEvent.change(textarea, { target: { value: comment.content } });
                    
                    // Submit
                    const submitButton = screen.getAllByText(/Submit/)[1];
                    await act(async () => {
                        fireEvent.click(submitButton);
                    });
                    
                    // Wait for modal to close
                    await waitFor(() => {
                        expect(screen.getByLabelText(/Leave a comment dialog/i)).not.toHaveClass('visible');
                    });
                    
                    // Wait for the element to appear
                    await waitFor(() => {
                        const element = screen.getByLabelText(new RegExp(`submitted-comment-${comment.actionID}`, 'i'));
                        expect(element).toBeInTheDocument();
                        expect(element).toHaveAttribute('id', String(comment.actionID));
                    }, { timeout: 3000 });
                }

                // Verify all comments are present
                comments.forEach((comment) => {
                    const element = screen.getByLabelText(new RegExp(`submitted-comment-${comment.actionID}`, 'i'));
                    expect(element).toBeInTheDocument();
                    expect(element).toHaveAttribute('id', String(comment.actionID));
                });
            });
           
        });

    })

    //Add tests for clicking Ask and Comment buttons when implemented fully
    
})



