import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import vieFlag from "@/assets/img/vietnam.png";
import engFlag from "@/assets/img/england.png";
import japFlag from "@/assets/img/jp.png";

const languages = [
  { code: "vi", label: "Tiếng Việt", flag: vieFlag },
  { code: "en-US", label: "English", flag: engFlag },
  { code: "ja", label: "日本語", flag: japFlag },
];

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [selectedLang, setSelectedLang] = useState(i18n.language);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    i18n.changeLanguage(selectedLang);
    localStorage.setItem("language", selectedLang);
  }, [selectedLang]);

  return (
    <div className="relative" tabIndex={0} onBlur={() => setIsOpen(false)}>
      <div
        className="flex gap-2 items-center cursor-pointer bg-gray-200 dark:bg-gray-800 px-3 py-2 rounded-[30px] hover:bg-gray-300 dark:hover:bg-gray-700 transition-all duration-200 dark:text-white font-medium"
        onClick={() => setIsOpen(!isOpen)}
      >
        <img
          src={languages.find((lang) => lang.code === selectedLang)?.flag}
          alt="language"
          className="w-6 h-6"
        />
        <span>
          {languages.find((lang) => lang.code === selectedLang)?.label}
        </span>
      </div>
      {isOpen && (
        <div className="absolute top-full p-2 left-0 mt-2 bg-white dark:bg-gray-800 dark:text-gray-200 shadow-md rounded-md w-40 z-50 ">
          {languages.map((lang) => (
            <div
              key={lang.code}
              className="flex dark:hover:bg-gray-700 items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-100 hover:rounded-md"
              onClick={() => {
                setSelectedLang(lang.code);
                setIsOpen(false);
              }}
            >
              <img src={lang.flag} alt={lang.label} className="w-6 h-6" />
              <span>{lang.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
