import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import ChatList from "../components/ChatList";
import Header from "../components/Header";
import { useModel } from "@/context/ModelContext";

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const { modelsList } = useModel();
  useEffect(() => {
    if (!localStorage.getItem("selectedModel")) {
      localStorage.setItem("selectedModel", modelsList[0]);
    }
  }, [modelsList]);
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
