import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const contentContainer = document.getElementById("main-content");
    if (contentContainer) {
      contentContainer.scrollTop = 0; // ✅ Resets scroll for the main content
    }
  }, [pathname]); // ✅ Runs whenever the route changes

  return null;
};

export default ScrollToTop;
