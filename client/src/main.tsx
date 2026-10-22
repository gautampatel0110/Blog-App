import ReactDOM from "react-dom/client";
import App from "./App";
import { Toaster } from "react-hot-toast";
import "./index.css";
import PublishingProvider from "./components/PublishingProvider";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

ReactDOM.createRoot(rootElement).render(
  <>
    <Toaster position="top-right" />
    <PublishingProvider><App /></PublishingProvider>
  </>
);
