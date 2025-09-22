import { useCallback, useEffect, useRef, useState } from "react";
import { TextInput } from "react-native";

/**
 * Focus-preserving debounced input hook using refs
 * Maintains focus even during component re-renders
 */
export const useDebouncedInput = (
  initialValue: string,
  onDebouncedChange: (value: string) => void,
  delay: number = 300,
) => {
  const [displayValue, setDisplayValue] = useState(initialValue);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);
  const isFocusedRef = useRef(false);
  const lastValueRef = useRef(initialValue);

  // Track focus state
  const handleFocus = useCallback(() => {
    isFocusedRef.current = true;
  }, []);

  const handleBlur = useCallback(() => {
    isFocusedRef.current = false;
  }, []);

  // Restore focus after re-renders if it was focused
  useEffect(() => {
    if (isFocusedRef.current && inputRef.current) {
      // Use a small timeout to ensure the component has finished rendering
      const focusTimeout = setTimeout(() => {
        if (isFocusedRef.current && inputRef.current) {
          inputRef.current.focus();
        }
      }, 10);

      return () => clearTimeout(focusTimeout);
    }
  });

  // Update display value from external state, but only when input is not focused
  // AND only when it's a different value (not just the result of our own update)
  useEffect(() => {
    // Allow external updates when not focused OR when the external change is significant
    // (like auto-fill changing 0 to a meaningful value)
    const shouldForceUpdate =
      initialValue !== displayValue &&
      (!isFocusedRef.current ||
        (displayValue === "0" && initialValue !== "" && initialValue !== "0"));

    if (shouldForceUpdate) {
      setDisplayValue(initialValue);
      lastValueRef.current = initialValue;
    }
  }, [initialValue, displayValue]);

  const handleChange = useCallback(
    (value: string) => {
      // Update display value immediately for responsive UI
      setDisplayValue(value);
      lastValueRef.current = value;

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout for debounced change
      timeoutRef.current = setTimeout(() => {
        onDebouncedChange(value);
      }, delay);
    },
    [onDebouncedChange, delay],
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    value: displayValue,
    onChange: handleChange,
    inputRef,
    onFocus: handleFocus,
    onBlur: handleBlur,
  };
};

/**
 * Specialized hook for numeric inputs with proper type conversion
 */
export const useDebouncedNumericInput = (
  initialValue: number | undefined,
  onDebouncedChange: (value: number | undefined) => void,
  delay: number = 300,
) => {
  const stringValue = initialValue?.toString() || "";

  const handleDebouncedChange = useCallback(
    (value: string) => {
      // Handle empty string as undefined, but allow 0 values
      const numericValue = value.trim() === "" ? undefined : parseFloat(value);
      onDebouncedChange(numericValue);
    },
    [onDebouncedChange],
  );

  const result = useDebouncedInput(stringValue, handleDebouncedChange, delay);

  return {
    value: result.value,
    onChange: result.onChange,
    inputRef: result.inputRef,
    onFocus: result.onFocus,
    onBlur: result.onBlur,
  };
};
