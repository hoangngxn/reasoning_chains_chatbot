import sendIcon from "./../assets/img/send.svg";
import micIcon from "./../assets/img/mic.svg";
import stopIcon from "./../assets/img/stop.svg";
import gemini from "./../assets/img/gemini.svg";
import ollama from "./../assets/img/ollama.svg";
import done from "./../assets/img/done.svg";
import setting from "./../assets/img/setting.svg";
import { useEffect, useRef, useState } from "react";
import { useModel } from "@/context/ModelContext";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

interface ChatInputProps {
  question: string;
  setQuestion: (value: string) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isWaitingForResponse: boolean;
}
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webkitSpeechRecognition?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SpeechRecognition?: any;
  }
  interface SpeechRecognitionEvent extends Event {
    readonly results: SpeechRecognitionResultList;
  }
}
const SpeechRecognition: typeof window.SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

const FormInput = ({
  question,
  setQuestion,
  handleSubmit,
  isWaitingForResponse,
}: ChatInputProps) => {
  const { modelsList } = useModel();
  const [isOpenMenu, setIsOpenMenu] = useState(false);
  const { t } = useTranslation();
  const [selectedModel, setSelectedModel] = useState(
    localStorage.getItem("selectedModel") ||
      (modelsList.length > 0 ? modelsList[0] : "")
  );
  const modelImages = [gemini, ollama];
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<typeof SpeechRecognition | null>(null);
  const [shouldSubmit, setShouldSubmit] = useState(false);
  const handleVoiceInput = () => {
    if (!SpeechRecognition) {
      toast.warn(t("not_support_voice"));
      return;
    }
    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.lang = "vi-VN";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setQuestion(transcript);
      };
      recognition.onend = () => {
        setIsRecording(false);
        recognitionRef.current = null;
      };
      recognitionRef.current = recognition;
    }
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
    setIsRecording(!isRecording);
  };

  const handleChangeModel = (model: string) => {
    setSelectedModel(model);
    localStorage.setItem("selectedModel", model);
  };

  const handleSubmitManually = () => {
    handleSubmit({
      preventDefault: () => {},
    } as React.FormEvent<HTMLFormElement>);
  };

  useEffect(() => {
    if (shouldSubmit) {
      handleSubmitManually();
      setShouldSubmit(false);
    }
  }, [shouldSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (question.trim() && !isWaitingForResponse) {
        const formatted = question.replace(/\n/g, "\n\n");
        setQuestion(formatted);
        setShouldSubmit(true);
      }
    }
  };

  return (
    <form
      className="flex items-center justify-between gap-1"
      onSubmit={handleSubmit}
    >
      <div
        className="relative "
        onClick={() => setIsOpenMenu(!isOpenMenu)}
        tabIndex={0}
        onBlur={() => setIsOpenMenu(false)}
      >
        <div className="w-[42px] h-[42px] border border-gray-500 rounded-full p-2 flex items-center justify-center cursor-pointer">
          <img
            src={setting}
            alt="dropdown"
            className="w-5 h-5 dark:invert transition-all duration-1000"
          />
        </div>

        {isOpenMenu && (
          <div className=" border border-gray-400 absolute p-2 bottom-[50px] left-[-20px] mt-2 w-72 text-xl font-medium bg-white dark:bg-gray-900 shadow-lg rounded-md text-gray-600 dark:text-gray-200 z-50">
            {modelsList.map((model, index) => (
              <div
                className="flex items-center gap-2 p-2 rounded-md hover:bg-[#d1d1d13e] dark:hover:bg-[#63636337] cursor-pointer"
                onClick={() => handleChangeModel(model)}
                key={model}
              >
                <img
                  src={modelImages[index]}
                  alt="model"
                  className="w-8 h-8 dark:invert transition-all duration-1000 mr-2"
                />
                <p className="capitalize">{model}</p>
                {model === selectedModel && (
                  <div className="flex flex-1 justify-end">
                    <img
                      src={done}
                      alt="done"
                      className="w-4 h-4 dark:invert transition-all duration-1000"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <textarea
        className="w-full p-2 border rounded-lg bg-transparent border-none outline-none scrollbar-hide resize-none white-space: pre-wrap focus:outline-none dark:text-white dark:placeholder-gray-300"
        placeholder={t("placeholder")}
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
      />
      {isWaitingForResponse ? (
        <button className="w-[50px] h-[50px] bg-[#f5145f] rounded-full p-3 flex items-center justify-center">
          <img src={stopIcon} alt="send" className="w-4 h-4 text-blue-700" />
        </button>
      ) : question ? (
        <button className="w-[50px] h-[50px] bg-[#f5145f] rounded-full p-3 flex items-center justify-center">
          <img src={sendIcon} alt="send" className="w-4 h-4 text-blue-700" />
        </button>
      ) : (
        <button
          className="w-[50px] h-[50px] bg-[#f5145f] rounded-full p-3 flex items-center justify-center"
          onClick={handleVoiceInput}
        >
          {isRecording ? (
            <img src={stopIcon} className="w-4 h-4" alt="" />
          ) : (
            <img src={micIcon} className="w-4 h-4" alt="" />
          )}
        </button>
      )}
    </form>
  );
};

export default FormInput;
