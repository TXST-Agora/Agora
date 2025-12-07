import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import Host from "../components/Host";
import { MemoryRouter } from "react-router-dom";

describe("Host Page", () => {
  let clipboardWriteTextMock: ReturnType<typeof vi.fn>;
  let fetchMock: ReturnType<typeof vi.fn>;

  // Mock navigator.clipboard once before all tests
  beforeAll(() => {
    clipboardWriteTextMock = vi.fn();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: clipboardWriteTextMock },
      writable: true,
      configurable: true
    });
    
    // Mock scrollIntoView which isn't available in JSDOM
    Element.prototype.scrollIntoView = vi.fn();
  });

  beforeEach(() => {
    vi.useFakeTimers();
    // Reset the mock before each test
    clipboardWriteTextMock.mockReset();
    
    // Mock fetch API
    fetchMock = vi.fn();
    (globalThis as any).fetch = fetchMock;
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders title, description field, and create button", () => {
    render(
      <MemoryRouter>
        <Host />
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/forum title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create session/i })
    ).toBeInTheDocument();
  });

  it("auto focuses the title input on mount", () => {
    render(
      <MemoryRouter>
        <Host />
      </MemoryRouter>
    );

    const titleInput = screen.getByLabelText(/forum title/i);
    expect(document.activeElement).toBe(titleInput);
  });

  it("shows validation error for empty title on submit", () => {
    render(
      <MemoryRouter>
        <Host />
      </MemoryRouter>
    );

    const titleInput = screen.getByLabelText(/forum title/i) as HTMLInputElement;

    // The component auto-focuses the input on mount, so we just need to blur it
    // This triggers the onBlur handler which sets titleTouched to true
    act(() => {
      titleInput.blur();
    });

    // Now the error should be visible since titleTouched=true and title is empty
    const errorElement = screen.getByText(/title is required/i);
    expect(errorElement).toBeInTheDocument();
    expect(errorElement).toHaveAttribute("role", "alert");
  });

  it("submits successfully and shows session code + toast", async () => {
    vi.useRealTimers();
    const mockSessionCode = "ABC123";
    
    // Mock successful API response
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        sessionCode: mockSessionCode,
        title: 'My Forum',
        description: '',
        mode: 'normal',
        hostStartTime: new Date().toISOString(),
        actions: []
      }),
    });

    render(
      <MemoryRouter>
        <Host />
      </MemoryRouter>
    );

    const titleInput = screen.getByLabelText(/forum title/i) as HTMLInputElement;
    
    // Simulate typing by changing the value and triggering React's onChange
    await act(async () => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set;
      
      nativeInputValueSetter?.call(titleInput, 'My Forum');
      titleInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const submitBtn = screen.getByRole("button", { name: /create session/i });
    
    // Click submit
    await act(async () => {
      submitBtn.click();
    });

    // Wait for API call to complete
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/session/create'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'My Forum',
            description: '',
            mode: 'normal',
          }),
        })
      );
    });

    // Wait for the session code to appear
    await waitFor(() => {
      expect(screen.getByText(/session code/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Verify the session code is displayed
    expect(screen.getByText(mockSessionCode)).toBeInTheDocument();

    // Check for toast (should still be visible)
    expect(screen.getByText(/your forum is ready/i)).toBeInTheDocument();
  });

  it("copy button works", async () => {
    vi.useRealTimers();
    const mockSessionCode = "XYZ789";
    
    // Mock successful API response
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        sessionCode: mockSessionCode,
        title: 'Demo',
        description: '',
        mode: 'normal',
        hostStartTime: new Date().toISOString(),
        actions: []
      }),
    });

    render(
      <MemoryRouter>
        <Host />
      </MemoryRouter>
    );

    const titleInput = screen.getByLabelText(/forum title/i) as HTMLInputElement;
    
    // Simulate typing by changing the value and triggering React's onChange
    await act(async () => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set;
      
      nativeInputValueSetter?.call(titleInput, 'Demo');
      titleInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const submitBtn = screen.getByRole("button", { name: /create session/i });
    
    await act(async () => {
      submitBtn.click();
    });

    // Wait for API call and session code to appear
    await waitFor(() => {
      expect(screen.getByText(mockSessionCode)).toBeInTheDocument();
    }, { timeout: 3000 });

    // The button's aria-label includes the session code
    const copyBtn = screen.getByRole("button", { name: new RegExp(`copy session code ${mockSessionCode}`, 'i') });
    
    // Click the copy button
    await act(async () => {
      copyBtn.click();
    });

    // The handleCopy is async but navigator.clipboard.writeText should be called
    await waitFor(() => {
      expect(clipboardWriteTextMock).toHaveBeenCalledOnce();
    });
    // Also verify it was called with the session code from the API
    expect(clipboardWriteTextMock).toHaveBeenCalledWith(mockSessionCode);
  });

  it("updates mode description when selecting modes", async () => {
    render(
      <MemoryRouter>
        <Host />
      </MemoryRouter>
    );

    // Use getByDisplayValue to find radio buttons by their value attribute
    const colorShiftRadio = screen.getByDisplayValue("colorShift") as HTMLInputElement;
    const sizePulseRadio = screen.getByDisplayValue("sizePulse") as HTMLInputElement;

    await act(async () => {
      colorShiftRadio.click();
    });
    
    expect(screen.getByText(/gradually change hue/i)).toBeInTheDocument();

    await act(async () => {
      sizePulseRadio.click();
    });
    
    expect(screen.getByText(/gradually grow over time/i)).toBeInTheDocument();
  });

  it("sends correct mode to API when mode is selected", async () => {
    vi.useRealTimers();
    const mockSessionCode = "MODE123";
    
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        sessionCode: mockSessionCode,
        title: 'Test Forum',
        description: '',
        mode: 'colorShift',
        hostStartTime: new Date().toISOString(),
        actions: []
      }),
    });

    render(
      <MemoryRouter>
        <Host />
      </MemoryRouter>
    );

    const titleInput = screen.getByLabelText(/forum title/i) as HTMLInputElement;
    const colorShiftRadio = screen.getByDisplayValue("colorShift") as HTMLInputElement;

    // Set title and select colorShift mode
    await act(async () => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set;
      
      nativeInputValueSetter?.call(titleInput, 'Test Forum');
      titleInput.dispatchEvent(new Event('change', { bubbles: true }));
      colorShiftRadio.click();
    });

    const submitBtn = screen.getByRole("button", { name: /create session/i });
    
    await act(async () => {
      submitBtn.click();
    });

    // Verify API was called with correct mode
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/session/create'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            title: 'Test Forum',
            description: '',
            mode: 'colorShift',
          }),
        })
      );
    }, { timeout: 3000 });
  });

  it("handles API error and shows error message", async () => {
    vi.useRealTimers();
    const errorMessage = "Failed to create session";
    
    // Mock failed API response
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: errorMessage }),
    });

    render(
      <MemoryRouter>
        <Host />
      </MemoryRouter>
    );

    const titleInput = screen.getByLabelText(/forum title/i) as HTMLInputElement;
    
    await act(async () => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set;
      
      nativeInputValueSetter?.call(titleInput, 'Test Forum');
      titleInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const submitBtn = screen.getByRole("button", { name: /create session/i });
    
    await act(async () => {
      submitBtn.click();
    });

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Verify retry button is shown
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  it("handles network error gracefully", async () => {
    vi.useRealTimers();
    // Mock network error
    fetchMock.mockRejectedValueOnce(new Error("Network error"));

    render(
      <MemoryRouter>
        <Host />
      </MemoryRouter>
    );

    const titleInput = screen.getByLabelText(/forum title/i) as HTMLInputElement;
    
    await act(async () => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set;
      
      nativeInputValueSetter?.call(titleInput, 'Test Forum');
      titleInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const submitBtn = screen.getByRole("button", { name: /create session/i });
    
    await act(async () => {
      submitBtn.click();
    });

    // Wait for error message to appear - network errors show generic message
    await waitFor(() => {
      const errorElement = screen.queryByText(/could not create session/i) || 
                          screen.queryByText(/network error/i) ||
                          screen.queryByText(/failed to create session/i);
      expect(errorElement).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});