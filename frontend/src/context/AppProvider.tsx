import { ReactNode } from "react";
import { UserProvider } from "./UserContext";
import { ChatProvider } from "./ChatContext";
import { ModelProvider } from "./ModelContext";

export const AppProvider = ({ children }: { children: ReactNode }) => {
  return (
    <UserProvider>
      <ChatProvider>
        <ModelProvider>{children}</ModelProvider>
      </ChatProvider>
    </UserProvider>
  );
};
