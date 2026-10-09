import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { SessionProvider } from "./session";
import App from "./App";
import { IconContext } from "@phosphor-icons/react";
import "./styles.css";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <SessionProvider>
        <IconContext.Provider value={{ "aria-hidden": true }}>
          <App />
        </IconContext.Provider>
      </SessionProvider>
    </BrowserRouter>
  </StrictMode>,
);
