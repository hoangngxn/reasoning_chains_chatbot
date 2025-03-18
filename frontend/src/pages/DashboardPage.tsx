import { useNavigate } from "react-router-dom";
import FormInput from "@/components/FormInput";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useChat } from "@/context/ChatContext";
import { toast } from "react-toastify";

const DashboardPage = () => {
  const navigate = useNavigate();
  const [question, setQuestion] = useState("");
  const { t } = useTranslation();
  const { tokenUsed, totalCredit, tokensPerDollar } = useChat();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!question) return;
    if (tokenUsed > totalCredit * tokensPerDollar) {
      toast.error(t("over_credit"));
      return;
    }
    try {
      const firstMessage = {
        role: "user",
        text: question,
      };
      navigate(`/dashboard/chats/new`, {
        state: { firstMessage },
      });
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <div className="h-screen w-full flex justify-center items-center ">
      <div className="w-1/2 flex flex-col items-center gap-8">
        <h1 className="text-3xl font-bold text-black dark:text-white">
          {t("welcome")}
        </h1>
        {/* Form Section */}
        <div className="w-full bg-white dark:bg-[#63636377] rounded-2xl p-4 shadow-[0_2px_10px_rgba(0,0,0,0.15)] transition-colors duration-1000">
          <FormInput
            question={question}
            setQuestion={setQuestion}
            handleSubmit={handleSubmit}
            isWaitingForResponse={false}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
