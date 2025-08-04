import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { preloadUserProfile } from "./hooks/use-user-profile";

// Preload user profile data immediately to prevent flashing
preloadUserProfile();

createRoot(document.getElementById("root")!).render(<App />);
