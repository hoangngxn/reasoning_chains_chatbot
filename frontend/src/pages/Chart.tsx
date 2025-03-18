import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  Cell,
} from "recharts";
import { useEffect, useState } from "react";
import {
  getUsageLastDaysService,
  getUsageModelService,
} from "@/services/apiService";
import Header from "@/components/Header";
import { useNavigate } from "react-router-dom";
import arrowLeftIcon from "@/assets/img/arrow_left.svg";
import { useTranslation } from "react-i18next";
import { useChat } from "@/context/ChatContext";

export default function UsageChart() {
  const [dataLineChart, setDataLineChart] = useState([]);
  const [dataBarChart, setDataBarChart] = useState<
    { model: string; token: number }[]
  >([]);
  const { totalCredit, tokensPerDollar } = useChat();
  const [usedCredit, setUsedCredit] = useState<number>(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const navigate = useNavigate();
  const COLORS = ["#8884d8", "#82ca9d"];
  const { t } = useTranslation();
  const getUsageLastDays = async () => {
    const response = await getUsageLastDaysService();
    setDataLineChart(response?.data?.usage_summary || []);
  };
  const getUsageModel = async () => {
    try {
      const resModel = await getUsageModelService();
      const dataUsageModel = resModel?.data || [];
      let totalToken = 0;
      dataUsageModel.forEach((item: { model: string; token: number }) => {
        totalToken += item.token;
      });
      setUsedCredit(Number((totalToken / tokensPerDollar).toFixed(2)));
      setDataBarChart(dataUsageModel);
    } catch (error) {
      console.error("Error fetching usage data:", error);
    }
  };
  useEffect(() => {
    getUsageLastDays();
    getUsageModel();
  }, []);

  return (
    <div className="flex flex-col bg-gray-100 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <Header
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <div className="mt-[80px] py-2 mb-2 text-left flex items-center gap-2 mx-10 w-[15%] hover:opacity-70 cursor-pointer">
        <img src={arrowLeftIcon} alt="" className="w-4 h-4 dark:invert" />
        <button
          onClick={() => navigate("/dashboard")}
          className=" text-gray-800 dark:text-gray-300 rounded-lg transition"
        >
          {t("homepage")}
        </button>
      </div>
      <div className="flex-1 px-10">
        <div className="bg-white dark:bg-gray-800 p-6 shadow-lg rounded-xl h-[calc((100vh-200px)/2)] flex flex-col">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
            {t("token_use_10_days")}
          </h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dataLineChart}>
                <XAxis dataKey="date" stroke="#ccc" />
                <YAxis />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{
                    backgroundColor: "rgba(31, 41, 55, 0.8)",
                    borderColor: "#4B5563",
                    color: "white",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="gemini-2.0-flash"
                  stroke={COLORS[0]}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="llama3.2:latest"
                  stroke={COLORS[1]}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 h-[calc((100vh-120px)/2)]">
          {/* Bar Chart */}
          <div className="bg-white dark:bg-gray-800 p-6 shadow-lg rounded-xl h-full flex flex-col">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              {t("total_token")}
            </h3>
            <div className="flex-1">
              <ResponsiveContainer width="100%">
                <BarChart data={dataBarChart} barGap={20}>
                  <XAxis dataKey="model" stroke="#ccc" />
                  <YAxis />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    contentStyle={{
                      backgroundColor: "rgba(31, 41, 55, 0.8)",
                      borderColor: "#4B5563",
                      color: "white",
                    }}
                  />
                  <Legend formatter={() => "token"} />
                  <Bar dataKey="token" fill="#859eb7">
                    {dataBarChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Credits Box */}
          <div className="bg-white dark:bg-gray-800 p-6 shadow-lg rounded-xl flex flex-col justify-center">
            <div className="flex items-center justify-between dark:bg-gray-800 rounded-lg mb-4">
              <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                {t("credits_remaining")}
              </h3>
              <div className="flex flex-col items-end">
                <div className="bg-green-100 max-w-[150px] mb-3 text-green-700 dark:bg-green-900 dark:text-green-300 px-3 py-1 rounded-full text-sm font-medium text-center">
                  10&#36; {t("free")}
                </div>
                <div className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-3 py-1 rounded-full text-sm font-medium">
                  1&#36; = {tokensPerDollar.toLocaleString("vi-VN")} tokens
                </div>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-green-500">
              ${usedCredit <= 10 ? (totalCredit - usedCredit).toFixed(2) : 0}
            </h2>
            <p className="text-sm text-gray-500">
              {t("used")}: ${usedCredit <= 10 ? usedCredit : 10} / $
              {totalCredit}
            </p>

            {/* color bar */}
            <div className="mt-4">
              <div className="w-full h-6 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-400 transition-all duration-300"
                  style={{ width: `${(usedCredit / totalCredit) * 100}%` }}
                ></div>
              </div>
            </div>
            {/* Note: color */}
            <div className="flex justify-between mt-4">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-400 rounded-full mr-2"></div>
                <span className="text-gray-600 dark:text-gray-300">
                  {t("used")}
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-300 dark:bg-gray-700 rounded-full mr-2"></div>
                <span className="text-gray-600 dark:text-gray-300">
                  {t("amount_remaining")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
