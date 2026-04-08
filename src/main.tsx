
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

// Force clear all old cache and localStorage on app load
if ('caches' in window) {
  caches.keys().then(cacheNames => {
    cacheNames.forEach(cacheName => {
      caches.delete(cacheName);
    });
  });
}

// Clear assessment questions from cache to force fresh load
localStorage.removeItem("assessment_questions");
localStorage.removeItem("publicAssessmentResults");

createRoot(document.getElementById("root")!).render(<App />);
