import { createContext, useContext, useState, ReactNode } from "react";

interface ModelContextType {
  modelsList: string[];
  setModelsList: (models: string[]) => void;
}

const ModelContext = createContext<ModelContextType | undefined>(undefined);

export const ModelProvider = ({ children }: { children: ReactNode }) => {
  const [modelsList, setModelsList] = useState<string[]>([]);

  return (
    <ModelContext.Provider value={{ modelsList, setModelsList }}>
      {children}
    </ModelContext.Provider>
  );
};

export const useModel = () => {
  const context = useContext(ModelContext);
  if (!context) throw new Error("useModel must be used within a ModelProvider");
  return context;
};
