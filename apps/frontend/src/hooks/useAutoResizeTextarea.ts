import { useEffect, useRef } from "react";

/**
 * Hook to auto-resize a textarea element based on its content
 * @param value - The current value of the textarea
 * @param maxHeight - Maximum height in pixels (default: 200)
 */
export const useAutoResizeTextarea = (
  value: string,
  maxHeight: number = 200
) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = "auto";
    const scrollHeight = textarea.scrollHeight;
    
    // Set height to scrollHeight, but cap at maxHeight
    const newHeight = Math.min(scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
  }, [value, maxHeight]);

  return textareaRef;
};

