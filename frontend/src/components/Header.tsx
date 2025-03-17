import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import sidebarIcon from "../assets/img/sidebar.svg";
import newChatIcon from "../assets/img/newchat.svg";
import codecompleteImgLight from "./../assets/img/Logo-light.svg";
import codecompleteImgDark from "./../assets/img/Logo-dark.svg";
import moonIcon from "./../assets/img/moon.svg";
import sunIcon from "./../assets/img/sun.svg";
import logoutIcon from "./../assets/img/logout.svg";
import { useChatSession } from "@chainlit/react-client";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import { toast } from "react-toastify";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import chartIcon from "@/assets/img/chart.svg";

interface HeaderProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}
const Header: React.FC<HeaderProps> = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const navigate = useNavigate();
  const { user, setUserInfor } = useUser();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(
    localStorage.getItem("theme") === "dark"
  );
  const { disconnect } = useChatSession();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("selectedModel");
    setUserInfor({
      username: "",
      token: "",
      email: "",
      isAuthenticated: false,
      picture: "",
    });
    disconnect();
    navigate("/login");
    toast.success(t("logout_success"));
  };

  const handleUsage = () => {
    navigate("/analyze");
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("transition-colors", "duration-2");
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const toggleTheme = () => {
    const newTheme = !isDark ? "dark" : "light";
    localStorage.setItem("theme", newTheme);
    setIsDark(!isDark);
    window.dispatchEvent(new Event("themeChange"));
  };

  return (
    <div className="w-full flex justify-between items-center pl-5 pr-10 absolute top-0">
      <div className="flex items-center gap-5">
        {!isSidebarOpen && (
          <div className="flex gap-5">
            <button onClick={() => setIsSidebarOpen(true)}>
              <img
                src={sidebarIcon}
                alt="Open Sidebar"
                className="w-6 h-6 dark:invert transition-all duration-1000"
              />
            </button>
            <Link to="/dashboard">
              <img
                src={newChatIcon}
                alt="New Chat"
                className="w-8 h-8 dark:invert transition-all duration-1000"
              />
            </Link>
          </div>
        )}
        {/* Logo */}
        <div className="w-22 h-20 flex items-center py-4">
          <img
            src={isDark ? codecompleteImgDark : codecompleteImgLight}
            alt="Code Complete"
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      <div className="flex gap-5 items-center">
        <LanguageSwitcher />
        {/* Toggle Light/Dark Mode */}
        <div className="w-6 h-6 cursor-pointer" onClick={() => toggleTheme()}>
          <img
            src={isDark ? moonIcon : sunIcon}
            alt="theme-icon"
            className="w-full h-full"
          />
        </div>

        {/* Avatar */}
        {user?.isAuthenticated === true && (
          <div
            className="relative w-8 h-8 cursor-pointer"
            onClick={() => setIsOpen(!isOpen)}
            tabIndex={0}
            onBlur={() => setIsOpen(false)}
          >
            {user?.picture !== "" ? (
              <img
                className="w-full h-full rounded-full"
                src={user.picture}
                alt="Avatar"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-pink-600 p-2 flex justify-center items-center uppercase font-medium">
                <span className="text-white">{user.username.slice(0, 1)}</span>
              </div>
            )}
            {isOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 shadow-lg rounded-md text-gray-700 dark:text-gray-200 z-50">
                <div className="p-3 flex flex-col justify-center items-center">
                  {user?.picture !== "" ? (
                    <img
                      className="w-12 h-12 rounded-full"
                      src={user.picture}
                      alt="Avatar"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-pink-600 p-2 flex justify-center items-center uppercase font-medium">
                      <span className="text-xl text-white ">
                        {user.username.slice(0, 1)}
                      </span>
                    </div>
                  )}
                  <span className="text-sm mt-2 px-3 text-center truncate w-[200px]">
                    {user?.email}
                  </span>
                </div>
                <div
                  className="p-3 flex justify-center border-t dark:border-gray-700 hover:bg-[#9b96963e]"
                  onClick={handleUsage}
                >
                  <img
                    className="opacity-80 dark:invert mr-2"
                    src={chartIcon}
                    alt=""
                  />
                  <p>{t("analyze")}</p>
                </div>

                <div
                  className="p-3 flex justify-center border-t dark:border-gray-700 hover:bg-[#9b96963e]"
                  onClick={handleLogout}
                >
                  <img
                    className="opacity-70 dark:invert mr-2"
                    src={logoutIcon}
                    alt=""
                  />
                  <p>{t("logout")}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;
