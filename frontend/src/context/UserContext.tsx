import { createContext, useContext, useState, ReactNode } from "react";

interface User {
  username: string;
  email: string;
  token: string;
  isAuthenticated: boolean;
  picture: string;
}

interface UserContextType {
  user: User | null;
  setUserInfor: (userData: User) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const DEFAULT_USER: User = {
  username: "",
  email: "",
  token: "",
  isAuthenticated: false,
  picture: "",
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(DEFAULT_USER);

  const setUserInfor = (userData: User) => {
    setUser(userData);
  };

  return (
    <UserContext.Provider value={{ user, setUserInfor }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
};
