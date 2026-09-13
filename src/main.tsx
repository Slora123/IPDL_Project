import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { setupMockApi } from "./lib/mockApi.ts";

setupMockApi();

createRoot(document.getElementById("root")!).render(
    <App />
);
