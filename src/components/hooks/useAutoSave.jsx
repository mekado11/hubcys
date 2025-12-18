
import { useEffect, useState } from 'react'; // Only useState and useEffect are needed for the new implementation

export const useAutoSave = (key, data, delay = 2000) => { // Default delay changed to 2000ms
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  useEffect(() => {
    // If there's no data to save or no key to identify the save, do nothing
    if (!data || !key) return;

    // Set a timeout to perform the save operation after the specified delay
    const timer = setTimeout(() => {
      try {
        setIsSaving(true); // Indicate that saving is in progress

        // SECURITY FIX: Use sessionStorage instead of localStorage for temporary data
        // This ensures autosaved data is cleared when the session ends
        const payload = {
          data,
          timestamp: Date.now()
        };
        sessionStorage.setItem(`autosave:${key}`, JSON.stringify(payload));
        setLastSaved(new Date()); // Update the last saved timestamp
      } catch (error) {
        console.error('Error auto-saving data:', error);
        // Do not show an error to the user for autosave failures, as it's a background process
      } finally {
        setIsSaving(false); // Reset saving status
      }
    }, delay);

    // Cleanup function to clear the timeout if dependencies change or component unmounts
    return () => clearTimeout(timer);
  }, [data, key, delay]); // Re-run effect when data, key, or delay changes

  /**
   * Loads the autosaved data from sessionStorage for the given key.
   * Clears data if it's older than 1 hour for security.
   * @param {any} fallback - The value to return if no data is found or an error occurs.
   * @returns {any} The loaded data or the fallback value.
   */
  const loadAutoSaved = (fallback = null) => {
    try {
      // SECURITY FIX: Use sessionStorage instead of localStorage
      const saved = sessionStorage.getItem(`autosave:${key}`);
      if (saved) {
        const { data, timestamp } = JSON.parse(saved);
        const age = Date.now() - timestamp;
        // Clear autosave data older than 1 hour for security
        const ONE_HOUR_MS = 60 * 60 * 1000;
        if (age > ONE_HOUR_MS) {
          sessionStorage.removeItem(`autosave:${key}`);
          return fallback;
        }
        return data; // Return the valid, not-too-old autosaved data
      }
    } catch (error) {
      console.error('Error loading autosaved data:', error);
      // If parsing fails or data is corrupted, remove the entry to prevent future errors
      sessionStorage.removeItem(`autosave:${key}`);
    }
    return fallback; // Return fallback if no data or error
  };

  /**
   * Clears the autosaved data from sessionStorage for the given key.
   */
  const clearAutoSaved = () => {
    try {
      sessionStorage.removeItem(`autosave:${key}`);
    } catch (error) {
      console.error('Error clearing autosaved data:', error);
    }
  };

  // The hook returns its current state and functions to interact with autosave
  return { isSaving, lastSaved, loadAutoSaved, clearAutoSaved };
};
