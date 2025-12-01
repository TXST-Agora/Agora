import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from "vitest";
import { render, screen, act } from "@testing-library/react";
import Host from "../components/Host";
import { MemoryRouter } from "react-router-dom";

describe("Host Page", () => {
  let clipboardWriteTextMock: ReturnType<typeof vi.fn>;

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
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
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

    // Advance timers to complete the async operation (1500ms setTimeout)
    await act(async () => {
      vi.runAllTimers();
    });

    // Wait for the session code to appear
    expect(screen.getByText(/session code/i)).toBeInTheDocument();

    // Check for toast (should still be visible)
    expect(screen.getByText(/your forum is ready/i)).toBeInTheDocument();
  });

  it("copy button works", async () => {
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

    await act(async () => {
      vi.runAllTimers();
    });

    // The button's aria-label includes the session code, so match on "Copy session code"
    const copyBtn = screen.getByRole("button", { name: /copy session code/i });
    
    // Click the copy button
    copyBtn.click();

    // The handleCopy is async but navigator.clipboard.writeText should be called immediately
    expect(clipboardWriteTextMock).toHaveBeenCalledOnce();
    // Also verify it was called with a session code (6 character string)
    expect(clipboardWriteTextMock).toHaveBeenCalledWith(expect.stringMatching(/^[A-Z2-9]{6}$/));
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
});