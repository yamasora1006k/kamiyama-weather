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

const MONTHS = ["1","2","3","4","5","6","7","8","9","10","11","12"];
const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const WEEKDAYS = ["月","火","水","木","金","土","日"];

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
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden text-gray-800">

      {/* Header — minimal */}
      <header className="shrink-0 flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200">
        <div>
          <h1 className="text-base font-semibold text-gray-900">神山町 天気確率予報</h1>
          <p className="text-xs text-gray-400 mt-0.5">気象庁の過去30年分データに基づく統計</p>
        </div>
        <span className="text-xs text-gray-400">{CURRENT_YEAR}年</span>
      </header>

      {/* Main */}
      <div className="flex flex-1 min-h-0 p-6 gap-6">

        {/* Left: calendar */}
        <div className="w-1/2 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 p-5 gap-4">

          {/* Month tabs */}
          <div className="flex gap-1 flex-wrap">
            {MONTHS.map((label, i) => {
              const m = i + 1;
              return (
                <button
                  key={m}
                  onClick={() => setSelectedMonth(m)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    selectedMonth === m
                      ? "bg-green-600 text-white"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {label}月
                </button>
              );
            })}
          </div>

          {/* Month label */}
          <div className="text-lg font-bold text-gray-900 -mb-1">
            {selectedMonth}月
          </div>

          {/* Weekday row */}
          <div className="grid grid-cols-7 text-center">
            {WEEKDAYS.map((d, i) => (
              <div key={d} className={`text-xs font-medium py-1 ${i === 5 ? "text-blue-400" : i === 6 ? "text-red-400" : "text-gray-400"}`}>
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-y-1 flex-1 content-start">
            {dayGrid.map((d, idx) => {
              if (d === null) return <div key={`e-${idx}`} />;
              const col = (startOffset + d - 1) % 7; // 0=Mon … 6=Sun
              const isSat = col === 5;
              const isSun = col === 6;
              const isSelected = adjustedDay === d;
              return (
                <button
                  key={d}
                  onClick={() => setSelectedDay(d)}
                  className={`mx-auto w-8 h-8 rounded-full text-sm transition-all flex items-center justify-center ${
                    isSelected
                      ? "bg-green-600 text-white font-bold shadow"
                      : isSun
                      ? "text-red-400 hover:bg-red-50"
                      : isSat
                      ? "text-blue-400 hover:bg-blue-50"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: result */}
        <div className="w-1/2 flex flex-col gap-4">

          {/* Selected date label */}
          <div className="text-lg font-bold text-gray-900">
            {selectedMonth}月 {adjustedDay}日
            <span className="text-sm font-normal text-gray-400 ml-2">の過去30年統計</span>
          </div>

          {!stats && (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              読み込み中...
            </div>
          )}

          {stats && result && (
            <div className="flex flex-col gap-4 flex-1">
              {/* Rain card */}
              <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex items-center gap-5">
                {/* Circle */}
                <div className="relative w-16 h-16 shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#e0e7ff" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="15" fill="none"
                      stroke="#3b82f6" strokeWidth="3"
                      strokeDasharray={`${(result.rain_probability / 100) * 94.2} 94.2`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-700">{result.rain_probability}%</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Droplets className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-semibold text-gray-800">降水確率</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">{result.rain_probability}%</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {result.rain_probability >= 60 ? "雨が降りやすい日" :
                     result.rain_probability >= 30 ? "雨の可能性あり" :
                     "晴れやすい日"}
                  </p>
                </div>
              </div>

              {/* Temp card */}
              {result.average_temperature !== null && (
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex items-center gap-5">
                  <div className="w-16 h-16 shrink-0 flex items-center justify-center rounded-full bg-orange-50">
                    <Thermometer className="w-7 h-7 text-orange-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-sm font-semibold text-gray-800">平均気温</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-600">{result.average_temperature}°C</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {result.average_temperature >= 25 ? "暑い日" :
                       result.average_temperature >= 15 ? "過ごしやすい" :
                       result.average_temperature >= 5  ? "肌寒い日" :
                       "寒い日"}
                    </p>
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-400">
                過去{result.years_analyzed}年分 / 穴吹観測点（神山町周辺）
              </p>
            </div>
          )}

          {stats && !result && (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              日付を選択してください
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
