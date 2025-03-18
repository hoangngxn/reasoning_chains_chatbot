import { createContext, useContext, useState, ReactNode } from "react";

interface Conversation {
  id_conv: string;
  content: string;
}

interface ChatContextType {
  chatList: Conversation[];
  addChatList: (conversationData: Conversation[]) => void;
  prevMessagesLength: number;
  setPrevMessagesLength: (length: number) => void;
  tokenUsed: number;
  setTokenUsed: (length: number) => void;
  totalCredit: number;
  setTotalCredit: (length: number) => void;
  tokensPerDollar: number;
  setTokensPerDollar: (length: number) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [chatList, setChatList] = useState<Conversation[]>([]);
  const [prevMessagesLength, setPrevMessagesLength] = useState<number>(0);
  const [tokenUsed, setTokenUsed] = useState<number>(0);
  const [totalCredit, setTotalCredit] = useState<number>(10);
  const [tokensPerDollar, setTokensPerDollar] = useState<number>(30000);

  const addChatList = (conversationData: Conversation[]) => {
    setChatList([...conversationData]);
  };

  return (
    <ChatContext.Provider
      value={{
        chatList,
        addChatList,
        prevMessagesLength,
        setPrevMessagesLength,
        tokenUsed,
        setTokenUsed,
        totalCredit,
        setTotalCredit,
        tokensPerDollar,
        setTokensPerDollar,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used within a ChatProvider");
  return context;
};
