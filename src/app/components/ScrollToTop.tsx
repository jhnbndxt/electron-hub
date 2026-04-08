import { useEffect } from "react";
import { useLocation } from "react-router";

/**
 * ScrollToTop component ensures the page scrolls to the top
 * on every route change. This prevents the "flicker" issue
 * when navigating from long pages (like dashboards) back to
 * the homepage.
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Immediately scroll to top with no animation
    window.scrollTo(0, 0);
    
    // Also ensure document.documentElement is at top
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  return null;
}
