import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getListConversations, getMe } from "@/services/apiService";
import { useUser } from "@/context/UserContext";
import { useChat } from "@/context/ChatContext";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

const OAuth2RedirectHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { setUserInfor } = useUser();
  const { addChatList } = useChat();
  const setUserContext = async (token: string) => {
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
    navigate("/dashboard");
    toast.success(t("login_success"));
  };
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");

    if (token) {
      try {
        localStorage.setItem("token", token);
        setUserContext(token);
      } catch (error) {
        console.error("Failed to save token:", error);
      }
    } else {
      console.warn("No token found in URL.");
      navigate("/login");
    }
  }, [location.search, navigate]);
  return <div></div>;
};

export default OAuth2RedirectHandler;
