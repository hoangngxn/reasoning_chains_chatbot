import { useLocation } from "react-router-dom";
import { useState, useEffect, useRef, useMemo } from "react";
import Markdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { SyncLoader } from "react-spinners";
import { CopyBlock, dracula } from "react-code-blocks";
import FormInput from "@/components/FormInput";
import logoMiniDark from "../assets/img/mini-dark.svg";
import logoMiniLight from "../assets/img/mini-light.svg";
import gemini from "./../assets/img/gemini.svg";
import ollama from "./../assets/img/ollama.svg";
import {
  IStep,
  useChatInteract,
  useChatMessages,
} from "@chainlit/react-client";
import { getHistory } from "@/services/apiService";
import { useNavigate } from "react-router-dom";
import { useChat } from "@/context/ChatContext";
import { getListConversations } from "@/services/apiService";
interface ModelResponse {
  text: string;
  model: string;
}

const ChatPage = () => {
  const path = useLocation().pathname;
  const navigate = useNavigate();
  const [question, setQuestion] = useState("");
  const chatId = path.split("/").pop() || "1";
  const location = useLocation();
  const { sendMessage } = useChatInteract();
  const { messages } = useChatMessages();
  const { addChatList, prevMessagesLength, setPrevMessagesLength } = useChat();
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const modelImages = [gemini, ollama];
  const [isDark, setIsDark] = useState(
    localStorage.getItem("theme") === "dark"
  );

  useEffect(() => {
    const handleThemeChange = () => {
      setIsDark(localStorage.getItem("theme") === "dark");
    };

    window.addEventListener("themeChange", handleThemeChange);
    return () => window.removeEventListener("themeChange", handleThemeChange);
  }, []);

  const firstMessage = location.state?.firstMessage || null;
  // list messages on UI
  const [history, setHistory] = useState(() => {
    return chatId === "new" && firstMessage ? [firstMessage] : [];
  });

  const sendFirstMessage = async (text: string) => {
    const tempMessage: IStep = {
      id: crypto.randomUUID(),
      name: "user",
      type: "user_message",
      output: text,
      createdAt: new Date().toISOString(),
      metadata: {
        model: localStorage.getItem("selectedModel"),
      },
    };
    await sendMessage(tempMessage);
    setIsWaitingForResponse(true);
  };

  useEffect(() => {
    if (chatId === "new") {
      sendFirstMessage(firstMessage.text);
    } else {
      getHistory(chatId).then((res) => {
        setIsWaitingForResponse(false);
        if (!res.data) return;
        const updatedHistory = res.data.map(
          (row: {
            role: string;
            messages: { text: string; model: string }[];
          }) => {
            if (row.messages.length === 2) {
              // 2 models
              return {
                role: "assistant",
                modelResponses: row.messages,
              };
            } else {
              // 1 model
              return {
                role: row.role === "user" ? "user" : "assistant",
                text: row.messages[0].text,
              };
            }
          }
        );
        setHistory(updatedHistory);
      });
    }
  }, [chatId]);

  function flattenMessages(
    messages: IStep[],
    condition: (node: IStep) => boolean
  ): IStep[] {
    return messages.reduce((acc: IStep[], node) => {
      if (condition(node)) {
        acc.push(node);
      }
      if (node.steps?.length) {
        acc.push(...flattenMessages(node.steps, condition));
      }
      return acc;
    }, []);
  }
  // Reset list conversations
  const updateListConversations = async () => {
    const responseConversation = await getListConversations();
    addChatList(responseConversation.data.reverse());
  };
  // messages => change
  const flatMessages = useMemo(() => {
    return flattenMessages(messages, (m) => m.type.includes("message"));
  }, [messages]);
  useEffect(() => {
    if (!flatMessages || flatMessages.length === 0) return;
    if (flatMessages.length === prevMessagesLength) return;
    setPrevMessagesLength(flatMessages.length);
    const newMessage = flatMessages[flatMessages.length - 1];
    if (
      //new chat
      chatId === "new" &&
      newMessage?.metadata?.conversation_id &&
      newMessage.name === "Assistant"
    ) {
      navigate(`/dashboard/chats/${newMessage.metadata.conversation_id}`, {
        replace: true,
      });
      updateListConversations();
    } else if (
      // old chat
      chatId === newMessage?.metadata?.conversation_id &&
      newMessage.name === "Assistant"
    ) {
      setIsWaitingForResponse(false);
      const modelResponses = JSON.parse(newMessage.output);
      if (newMessage.metadata.message_type === "single") {
        setHistory((prev) => [
          ...prev,
          { role: "assistant", text: modelResponses[0].text },
        ]);
      } else if (newMessage.metadata.message_type === "multiple") {
        setHistory((prev) => [
          ...prev,
          {
            role: "assistant",
            modelResponses,
          },
        ]);
      }
    }
  }, [flatMessages]);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [history]);

  const addMessage = async (newMessage: string) => {
    if (chatId === "new") return;
    const content = newMessage.trim();
    if (!content) return;
    const tempMessage: IStep = {
      id: crypto.randomUUID(),
      name: "user",
      type: "user_message",
      output: content,
      createdAt: new Date().toISOString(),
      metadata: {
        conversation_id: chatId,
        model: localStorage.getItem("selectedModel"),
      },
    };
    try {
      sendMessage(tempMessage);
      setHistory((prev) => [...prev, { role: "user", text: content }]);
      setIsWaitingForResponse(true);
    } catch (error) {
      console.error(error);
    }
  };
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!question.trim()) return;
    addMessage(question);
    setQuestion("");
  };
  return (
    <div className="flex flex-col items-center h-full w-full mt-16 overflow-hidden relative">
      <div
        className="flex-1 overflow-y-auto scrollbar-thin w-full flex justify-center mb-20"
        style={{
          scrollbarColor: "gray transparent",
          scrollbarWidth: "thin",
        }}
        ref={chatContainerRef}
      >
        <div className="w-[75%] flex flex-col gap-5 p-4">
          {history.map((message, i) => (
            <div
              key={i}
              className={`p-4 ${
                message.modelResponses ? "max-w-[100%]" : "max-w-[80%]"
              } rounded-xl ${
                message.role === "user"
                  ? "bg-[#d1d1d164] self-end text-black dark:bg-[#63636377] dark:text-white"
                  : "self-start text-black dark:text-white"
              }`}
            >
              {message.modelResponses ? (
                <div className="grid grid-cols-2 gap-6">
                  {message.modelResponses.map(
                    (res: ModelResponse, idx: number) => (
                      <div
                        key={idx}
                        className="p-4 border rounded-2xl shadow-md bg-white dark:bg-gray-900 transition-all duration-500 max-h-fit"
                      >
                        <div className="flex justify-center gap-2 pb-3">
                          <img
                            src={modelImages[idx]}
                            alt=""
                            className="w-8 h-8"
                          />
                          <p className="font-semibold text-lg text-gray-800 dark:text-gray-200 text-center capitalize">
                            {res.model}
                          </p>
                        </div>
                        <div className="mt-2 text-gray-700 dark:text-gray-300 text-justify ">
                          <Markdown
                            remarkPlugins={[remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={{
                              code({ className, children, ...props }) {
                                const language =
                                  className?.match(/language-(\w+)/)?.[1] ||
                                  "plaintext";
                                const isInline =
                                  typeof children === "string" &&
                                  !children.includes("\n");

                                if (!isInline) {
                                  return (
                                    <div className="relative">
                                      <div className="overflow-x-auto text-sm bg-black dark:bg-black p-2 rounded-lg">
                                        <CopyBlock
                                          text={String(children).trim()}
                                          language={language}
                                          showLineNumbers
                                          theme={{
                                            ...dracula,
                                            backgroundColor: "transparent",
                                          }}
                                          wrapLongLines={true}
                                        />
                                      </div>
                                    </div>
                                  );
                                }

                                return (
                                  <code
                                    className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded"
                                    {...props}
                                  >
                                    {children}
                                  </code>
                                );
                              },
                            }}
                          >
                            {res.text}
                          </Markdown>
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="text-gray-700 dark:text-gray-300 text-justify mt-0 leading-[1.5]">
                  <Markdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      code({ className, children, ...props }) {
                        const language =
                          className?.match(/language-(\w+)/)?.[1] ||
                          "plaintext";
                        const isInline =
                          typeof children === "string" &&
                          !children.includes("\n");

                        if (!isInline) {
                          return (
                            <div className="relative">
                              <div className="overflow-x-auto text-sm bg-black dark:bg-black p-2 rounded-lg">
                                <CopyBlock
                                  text={String(children).trim()}
                                  language={language}
                                  showLineNumbers
                                  theme={{
                                    ...dracula,
                                    backgroundColor: "transparent",
                                  }}
                                  wrapLongLines={true}
                                />
                              </div>
                            </div>
                          );
                        }

                        return (
                          <code
                            className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded"
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {message.text}
                  </Markdown>
                </div>
              )}
            </div>
          ))}
          {isWaitingForResponse && (
            <div className="self-start flex items-center gap-4">
              <img
                src={isDark ? logoMiniDark : logoMiniLight}
                alt="theme-icon"
                className="w-8 h-8"
              />
              <SyncLoader size={6} color="gray" />
            </div>
          )}
          <div className="w-full min-h-[2rem] "></div>
        </div>
      </div>
      {/* Form input */}
      <div className="w-[71%] mb-5 absolute bottom-0 bg-white dark:bg-[#2f2c3b] rounded-2xl p-4 shadow-[0_2px_10px_rgba(0,0,0,0.15)] transition-colors duration-1000">
        <FormInput
          question={question}
          setQuestion={setQuestion}
          handleSubmit={handleSubmit}
          isWaitingForResponse={isWaitingForResponse}
        />
      </div>
    </div>
  );
};

export default ChatPage;
