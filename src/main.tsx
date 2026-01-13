import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initChunkErrorHandler } from "@/lib/chunkErrorHandler";

// Initialize chunk error handler for deployment resilience
initChunkErrorHandler();

createRoot(document.getElementById("root")!).render(<App />);
