import { useEffect, useState } from "react";
import { Droplets, Thermometer } from "lucide-react";

interface WeatherStats {
  [month: string]: {
    [day: string]: {
      rain_probability: number;
      average_temperature: number | null;
      years_analyzed: number;
    };
  };
}

const MONTHS = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];
const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const today = new Date();
const CURRENT_YEAR = today.getFullYear();

export default function Home() {
  const [stats, setStats] = useState<WeatherStats | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState(today.getDate());

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}weather_stats.json`)
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error("Failed to load weather stats:", err));
  }, []);

  const maxDays = DAYS_IN_MONTH[selectedMonth - 1];
  const adjustedDay = Math.min(selectedDay, maxDays);
  const result = stats?.[selectedMonth.toString()]?.[adjustedDay.toString()] ?? null;

  const dayGrid: (number | null)[] = [];
  const firstDow = new Date(CURRENT_YEAR, selectedMonth - 1, 1).getDay();
  const startOffset = firstDow === 0 ? 6 : firstDow - 1;
  for (let i = 0; i < startOffset; i++) dayGrid.push(null);
  for (let d = 1; d <= maxDays; d++) dayGrid.push(d);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 via-green-50 to-blue-100 overflow-hidden">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-green-200 shrink-0 px-6 py-3">
        <h1 className="text-xl font-bold text-green-900">神山町 天気確率予報</h1>
        <p className="text-gray-400 text-xs">気象庁の過去30年分データから天気確率を予測します</p>
      </header>

      {/* Body */}
      <div className="flex flex-1 gap-4 p-4 min-h-0">

        {/* Left: date picker */}
        <div className="bg-white/90 rounded-2xl shadow-lg border border-green-200 p-4 flex flex-col gap-3 w-72 shrink-0">
          {/* Year + month label */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs text-gray-400">{CURRENT_YEAR}年</span>
            <span className="text-xl font-bold text-green-900">{MONTHS[selectedMonth - 1]}</span>
          </div>

          {/* Month buttons */}
          <div className="grid grid-cols-6 gap-1">
            {MONTHS.map((label, i) => {
              const m = i + 1;
              return (
                <button
                  key={m}
                  onClick={() => setSelectedMonth(m)}
                  className={`py-1 rounded-md text-xs font-medium transition-all ${
                    selectedMonth === m
                      ? "bg-green-700 text-white shadow"
                      : "bg-gray-100 text-gray-600 hover:bg-green-100"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Calendar */}
          <div className="flex-1">
            <div className="grid grid-cols-7 mb-0.5">
              {["月","火","水","木","金","土","日"].map((d) => (
                <div key={d} className="text-center text-xs text-gray-400 py-0.5">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {dayGrid.map((d, idx) =>
                d === null ? (
                  <div key={`e-${idx}`} />
                ) : (
                  <button
                    key={d}
                    onClick={() => setSelectedDay(d)}
                    className={`aspect-square rounded-lg text-xs font-medium transition-all ${
                      adjustedDay === d
                        ? "bg-green-700 text-white shadow"
                        : "bg-gray-100 text-gray-700 hover:bg-green-100"
                    }`}
                  >
                    {d}
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Right: result */}
        <div className="flex-1 flex flex-col justify-center">
          {!stats && (
            <p className="text-center text-gray-400 text-sm">データを読み込み中...</p>
          )}

          {stats && result && (
            <div className="bg-white/90 rounded-2xl shadow-lg border border-green-200 p-6">
              <h2 className="text-base font-bold text-green-900 mb-4">
                {CURRENT_YEAR}年 {MONTHS[selectedMonth - 1]} {adjustedDay}日の統計
              </h2>

              <div className="flex flex-col gap-3">
                {/* Rain */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl flex items-center gap-4">
                  <div className="relative w-20 h-20 shrink-0">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#e0e7ff" strokeWidth="10" />
                      <circle
                        cx="50" cy="50" r="40" fill="none"
                        stroke="#2563eb" strokeWidth="10"
                        strokeDasharray={`${(result.rain_probability / 100) * 251.3} 251.3`}
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-blue-900">{result.rain_probability}%</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Droplets className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-900">降水確率</span>
                    </div>
                    <p className="text-xs text-blue-700">
                      {result.rain_probability >= 60 ? "雨が降りやすい日です" :
                       result.rain_probability >= 30 ? "雨の可能性があります" :
                       "晴れやすい日です"}
                    </p>
                  </div>
                </div>

                {/* Temperature */}
                {result.average_temperature !== null && (
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl flex items-center gap-4">
                    <div className="w-20 flex items-center justify-center shrink-0">
                      <span className="text-3xl font-bold text-orange-900">{result.average_temperature}°</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Thermometer className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-semibold text-orange-900">平均気温</span>
                      </div>
                      <p className="text-xs text-orange-700">
                        {result.average_temperature >= 25 ? "暑い日になりそうです" :
                         result.average_temperature >= 15 ? "過ごしやすい気温です" :
                         result.average_temperature >= 5 ? "肌寒い日です" :
                         "寒い日になりそうです"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-400 mt-3">
                過去{result.years_analyzed}年分の観測データ（穴吹観測点）に基づく統計
              </p>
            </div>
          )}

          {stats && !result && (
            <p className="text-center text-gray-400 text-sm">日付を選択してください</p>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="shrink-0 text-center text-xs text-gray-400 pb-2">
        データソース: 気象庁 | 穴吹観測点（神山町周辺）| 1996年〜2025年
      </footer>
    </div>
  );
}
