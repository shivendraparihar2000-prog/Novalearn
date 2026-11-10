import { useCallback, useEffect, useState } from 'react';
import { pageForPath, pathForPage } from './routes.js';

// Keeps the existing page-state UI intact while making every current screen
// addressable and browser back/forward aware. It deliberately adds no route
// guards: the existing application permits guest preview behaviour.
export function useBrowserNavigation(initialPage) {
  const [page, setCurrentPage] = useState(() => {
    if (window.location.pathname === '/') return initialPage;
    return pageForPath(window.location.pathname, initialPage);
  });

  const setPage = useCallback((nextPage) => {
    const nextPath = pathForPage(nextPage);
    if (window.location.pathname !== nextPath) window.history.pushState({}, '', nextPath);
    setCurrentPage(nextPage);
  }, []);

  useEffect(() => {
    const onPopState = () => setCurrentPage(pageForPath(window.location.pathname, initialPage));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [initialPage]);

  return [page, setPage];
}
