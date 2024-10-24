import { useState, useEffect } from 'react';

export function useFocus(): boolean {
  const [canFocus, setCanFocus] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    
    const updateCanFocus = (event: MediaQueryListEvent | MediaQueryList) => {
      setCanFocus(event.matches);
    };

    // Set initial value
    updateCanFocus(mediaQuery);

    // Add event listener
    mediaQuery.addEventListener('change', updateCanFocus);

    // Cleanup
    return () => mediaQuery.removeEventListener('change', updateCanFocus);
  }, []);

  return canFocus;
}
