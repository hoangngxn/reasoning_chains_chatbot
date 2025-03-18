import googleIcon from "./../assets/img/google-icon.png";
import { Link } from "react-router-dom";
import { useState } from "react";
import { loginService } from "@/services/apiService";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import Header from "@/components/Header";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { t } = useTranslation();
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const handleLogin = async () => {
    if (!email || !password) {
      toast.warn(t("enter_infor"));
      return;
    }
    try {
      const responseLogin = await loginService(email, password);
      const token = responseLogin.data.token;
      localStorage.setItem("token", token);
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast.error(t("wrong_account"));
    }
  };
  const handleLoginGoogle = async () => {
    window.location.href = `${import.meta.env.VITE_BACKEND_URL}/auth/google`;
  };
  return (
    <div className="h-screen w-full flex flex-col">
      <div>
        <Header
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />
      </div>
      <div className="flex-1 flex flex-col justify-center items-center w-full">
        <h1 className="font-bold text-[32px] uppercase mb-8"> {t("login")}</h1>
        {/* Form */}
        <div className="flex flex-col w-80">
          <div className="relative w-80 mb-6">
            <input
              type="email"
              id="email"
              className="peer w-full border border-gray-300 bg-transparent dark:text-white rounded-md px-3 pt-4 pb-2 text-gray-900 focus:border-[#f5145f] focus:ring-1 focus:ring-[#f5145f] outline-none"
              placeholder=" "
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <label
              htmlFor="email"
              className="absolute left-3 -top-2 bg-white dark:bg-black  px-1 text-sm text-[#f5145f] transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2 peer-focus:text-sm peer-focus:text-[#f5145f]"
            >
              {t("email")} {"\u002A"}
            </label>
          </div>

          <div className="relative w-80 mb-6">
            <input
              type="password"
              id="password"
              className="peer w-full border border-gray-300 bg-transparent dark:text-white rounded-md px-3 pt-4 pb-2 text-gray-900  focus:border-[#f5145f] focus:ring-1 focus:ring-[#f5145f] outline-none "
              placeholder=" "
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <label
              htmlFor="password"
              typeof="password"
              className="absolute left-3 -top-2 bg-white dark:bg-black px-1 text-sm text-[#f5145f] transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2 peer-focus:text-sm peer-focus:text-[#f5145f]"
            >
              {t("password")} {"\u002A"}
            </label>
          </div>

          <button
            className="bg-[#f5145f] text-lg text-white py-2 rounded-lg text-center hover:bg-[#f5145f8b]"
            onClick={handleLogin}
          >
            {t("login")}
          </button>
        </div>
        {/* Navigate sign-up */}
        <div className="flex gap-4 my-6">
          <span>{t("no_account")}</span>
          <Link
            to={"/sign-up"}
            className="text-[#f5145f] hover:text-[#f5145f8b]"
          >
            {t("signup")}
          </Link>
        </div>
        <div className="flex items-center w-80 mb-6">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="px-3 text-gray-500 text-sm">{t("or")}</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <div
          className="w-80 flex justify-center gap-6 border border-[#dbdada] py-4 rounded-lg hover:cursor-pointer hover:bg-[#e3e3e3] dark:hover:text-black"
          onClick={handleLoginGoogle}
        >
          <span className="text-base">{t("login_google")}</span>
          <button>
            <div className="w-6 h-6">
              <img src={googleIcon} alt="" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
export default Login;
