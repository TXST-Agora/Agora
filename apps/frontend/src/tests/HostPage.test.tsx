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
      json: async () => ({ code: mockSessionCode }),
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
        expect.stringContaining('/api/v1/session/code'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'My Forum',
            description: '',
            sessionType: 'normal',
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
      json: async () => ({ code: mockSessionCode }),
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

    // The button's aria-label includes the session code, so match on "Copy session code"
    const copyBtn = screen.getByRole("button", { name: new RegExp(`copy session code`, 'i') });
    
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
    
    expect(screen.getByText(/grow and shrink/i)).toBeInTheDocument();
  });

  it("sends correct sessionType to API when mode is selected", async () => {
    vi.useRealTimers();
    const mockSessionCode = "MODE123";
    
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ code: mockSessionCode }),
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

    // Verify API was called with correct sessionType
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/session/code'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            title: 'Test Forum',
            description: '',
            sessionType: 'colorShift',
          }),
        })
      );
    }, { timeout: 3000 });
  });

  it("handles API error and shows error message", async () => {
    vi.useRealTimers();
    const errorMessage = "Failed to generate session code";
    
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

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});