import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import { RecoilRoot } from "recoil";
import "./index.css";
import { ChainlitAPI, ChainlitContext } from "@chainlit/react-client";
import { ToastContainer } from "react-toastify";
import { AppProvider } from "@/context/AppProvider.tsx";
import "@/i18n";
const CHAINLIT_SERVER = `${import.meta.env.VITE_SOCKET_URL}/chainlit`;

const apiClient = new ChainlitAPI(CHAINLIT_SERVER, "webapp");

ReactDOM.createRoot(document.getElementById("root")!).render(
  // <React.StrictMode>
  <ChainlitContext.Provider value={apiClient}>
    <RecoilRoot>
      <AppProvider>
        <BrowserRouter>
          <App />
          <ToastContainer
            position="top-right"
            autoClose={1500}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </BrowserRouter>
      </AppProvider>
    </RecoilRoot>
  </ChainlitContext.Provider>
  // </React.StrictMode>
);
