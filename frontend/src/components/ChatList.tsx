import { Link, useLocation, useNavigate } from "react-router-dom";
import sidebarIcon from "../assets/img/sidebar.svg";
import newChatIcon from "../assets/img/newchat.svg";
import dotIcon from "./../assets/img/dot.svg";
import deleteIcon from "./../assets/img/delete.svg";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useChat } from "@/context/ChatContext";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
  deleteConversation,
  getListConversations,
} from "@/services/apiService";
import { createPortal } from "react-dom";

interface Chat {
  id_conv: string;
  content: string;
}

interface ChatListProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

interface DropdownMenuProps {
  isOpen: boolean;
  setIsOpen: (value: null | string) => void;
  targetRef: React.RefObject<HTMLImageElement>;
  conv_id: string;
  setListConversation: React.Dispatch<React.SetStateAction<Chat[]>>;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({
  isOpen,
  setIsOpen,
  targetRef,
  conv_id,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const navigate = useNavigate();
  const { addChatList } = useChat();
  const { t } = useTranslation();

  useLayoutEffect(() => {
    if (isOpen && targetRef?.current) {
      const rect = targetRef.current.getBoundingClientRect();
      setPosition({
        top: window.scrollY + rect.bottom - 6,
        left: window.scrollX + rect.left,
      });
    }
  }, [isOpen, targetRef]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        targetRef.current &&
        !targetRef.current.contains(event.target as Node)
      ) {
        setIsOpen(null);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, setIsOpen, targetRef]);

  if (!isOpen) return null;

  const handleDelete = async () => {
    setIsOpen(null);
    try {
      const response = await deleteConversation(conv_id);
      if (response.status === 200) {
        if (location.pathname === `/dashboard/chats/${conv_id}`) {
          navigate("/dashboard");
        }
        const responseConversation = await getListConversations();
        addChatList(responseConversation.data.reverse());
        toast.success(t("delete_success"));
      }
    } catch (error) {
      toast.error(t("delete_failed"));
    }
  };

  return createPortal(
    <div
      ref={menuRef}
      className="absolute w-28 bg-white dark:bg-gray-800 shadow-lg rounded-md w-32 p-1 z-50 border border-gray-300"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <button
        className="w-full flex justify-center items-center px-3 py-1 text-red-500 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
        onClick={() => handleDelete()}
      >
        <img src={deleteIcon} alt="Delete" className="w-4 h-4 mr-2" />
        {t("delete")}
      </button>
    </div>,
    document.body
  );
};

const ChatList: React.FC<ChatListProps> = ({
  isSidebarOpen,
  setIsSidebarOpen,
}) => {
  const { chatList } = useChat();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState<null | string>(null);
  const [listConversation, setListConversation] = useState(chatList);
  const buttonRefs = useRef<{ [key: string]: HTMLImageElement | null }>({});
  const { t } = useTranslation();
  useEffect(() => {
    setListConversation(chatList);
  }, [chatList]);

  return (
    <div className="relative">
      <div
        className={`fixed top-0 left-0 h-full w-[260px] bg-[#f9f9f9] dark:bg-[#918f8f2f] shadow-lg p-5 transition-transform duration-1000 flex flex-col ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <button
            className="w-6 h-6 dark:invert transition-all duration-500"
            onClick={() => setIsSidebarOpen(false)}
          >
            <img src={sidebarIcon} alt="Toggle Sidebar" />
          </button>
          <Link to="/dashboard" className="w-8 h-8">
            <img
              className="w-8 h-8 dark:invert transition-all duration-500"
              src={newChatIcon}
              alt="New Chat"
            />
          </Link>
        </div>

        <span className="font-semibold text-xs mb-2 text-gray-500 uppercase">
          {t("dashboard")}
        </span>
        <Link
          to="/dashboard"
          className="block px-3 py-2 rounded-lg hover:bg-[#d1d1d13e] dark:hover:bg-[#63636337] text-sm"
        >
          {t("newchat")}
        </Link>
        <hr className="border-none h-[2px] bg-gray-400 opacity-30 rounded my-5" />

        <span className="font-semibold text-xs mb-2 text-gray-500 uppercase">
          {t("recent")}
        </span>
        <div
          className="flex-1 min-h-0 overflow-y-auto scrollbar-thin"
          style={{
            scrollbarColor: "gray transparent",
            scrollbarWidth: "thin",
          }}
        >
          {listConversation.map((chat) => {
            const isActive =
              location.pathname === `/dashboard/chats/${chat.id_conv}`;

            return (
              <div
                className={`relative group flex pl-3 pr-3 py-2 rounded-lg hover:bg-[#d1d1d13e] dark:hover:bg-[#63636337] ${
                  isActive ? "bg-[#d1d1d168] dark:bg-[#61606a77]" : ""
                } text-sm`}
                key={chat.id_conv}
              >
                <Link
                  to={`/dashboard/chats/${chat.id_conv}`}
                  className={`truncate text-sm flex-1`}
                >
                  {chat.content}
                </Link>
                <img
                  ref={(el) => (buttonRefs.current[chat.id_conv] = el)}
                  src={dotIcon}
                  alt="More"
                  className="opacity-0 group-hover:opacity-80 dark:invert transition-opacity duration-400 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen((prev) =>
                      prev === chat.id_conv ? null : chat.id_conv
                    );
                  }}
                  tabIndex={0}
                />
                {isOpen === chat.id_conv && (
                  <DropdownMenu
                    isOpen={true}
                    setIsOpen={setIsOpen}
                    targetRef={{ current: buttonRefs.current[chat.id_conv] }}
                    conv_id={chat.id_conv}
                    setListConversation={setListConversation}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ChatList;
