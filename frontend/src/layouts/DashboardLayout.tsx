import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import ChatList from "../components/ChatList";
import Header from "../components/Header";
import { useModel } from "@/context/ModelContext";
import { useChat } from "@/context/ChatContext";
import { getTotalTokensService } from "@/services/apiService";
const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const { modelsList } = useModel();
  const { setTokenUsed } = useChat();
  useEffect(() => {
    if (!localStorage.getItem("selectedModel")) {
      localStorage.setItem("selectedModel", modelsList[0]);
    }
  }, [modelsList]);
  const getTotalTokens = async () => {
    const res = await getTotalTokensService();
    const data = res?.data || {};
    setTokenUsed(data?.total_tokens || 0);
  };
  useEffect(() => {
    getTotalTokens();
  }, []);
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <div
        className={`transition-all duration-1000 ${
          isSidebarOpen ? "w-[250px]" : "w-[0px]"
        }`}
      >
        <ChatList
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />
      </div>
      <div
        className={`relative flex-1 flex flex-col transition-all ${
          isSidebarOpen ? "w-[calc(100%-250px)]" : "ml-0"
        }`}
      >
        <Header
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;
