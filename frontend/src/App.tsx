import { useEffect } from "react";
import { sessionState, useChatSession } from "@chainlit/react-client";
import { useRecoilValue } from "recoil";
import DashboardPage from "./pages/DashboardPage";
import Login from "./pages/Login";
import { Route, Routes, Navigate, Outlet, useLocation } from "react-router-dom";
import SignUp from "@/pages/SignUp";
import DashboardLayout from "@/layouts/DashboardLayout";
import ChatPage from "@/pages/ChatPage";
import { useUser } from "@/context/UserContext";
import { useChat } from "@/context/ChatContext";
import { useModel } from "@/context/ModelContext";
import OAuth2RedirectHandler from "@/components/OAuth2RedirectHandler";
import {
  getListConversations,
  getMe,
  getModelsService,
} from "@/services/apiService";
import { useNavigate } from "react-router-dom";
import UsageChart from "@/pages/Chart";

function App() {
  const { user, setUserInfor } = useUser();
  const { addChatList } = useChat();
  const { setModelsList } = useModel();
  const { connect } = useChatSession();
  const session = useRecoilValue(sessionState);
  const path = useLocation().pathname;
  const navigate = useNavigate();
  const getUserAccount = async (token: string) => {
    const responseUser = await getMe();
    const user = responseUser.data;
    setUserInfor({
      username: user.username,
      email: user.email,
      token,
      isAuthenticated: true,
      picture: user.picture,
    });
    const responseConversation = await getListConversations();
    addChatList(responseConversation.data.reverse());
    if (path.startsWith(`/dashboard/chats`) || path.startsWith("/analyze")) {
      navigate(`${path}`);
    } else {
      navigate("/dashboard");
    }
  };
  const getModelsList = async () => {
    const res: { data: { models: string[] } } = await getModelsService();
    const modelsList = res?.data?.models || [];
    setModelsList(modelsList);
  };
  useEffect(() => {
    getModelsList();
    const token = localStorage.getItem("token");
    if (token) {
      getUserAccount(token);
    } else {
      navigate("/login");
    }
  }, []);
  useEffect(() => {
    if (session?.socket.connected) return;
    if (user?.isAuthenticated) {
      connect({
        transports: ["websocket"],
        userEnv: {
          Authorization: `Bearer ${user.token}`,
          user_email: user.email,
        },
        withCredentials: true,
      });
    }
  }, [connect, user]);

  return (
    <Routes>
      <Route
        path="/"
        element={
          user?.isAuthenticated ? <DashboardLayout /> : <Navigate to="/login" />
        }
      />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="chats/:id" element={<ChatPage />} />
        </Route>
        <Route path="/analyze" element={<UsageChart />} />
      </Route>

      <Route path="/login" element={<Login />} />
      <Route path="/sign-up" element={<SignUp />} />
      <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />
    </Routes>
  );
}

// Protected Route Component
const ProtectedRoute = () => {
  const { user } = useUser();
  return user?.isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default App;
