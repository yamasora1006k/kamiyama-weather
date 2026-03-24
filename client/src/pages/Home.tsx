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
    <>
      {/* ─── PC layout (md+): fixed full-screen, no scroll ─── */}
      <div className="hidden md:flex h-screen flex-col bg-gray-50 text-gray-800 overflow-hidden">
        {/* Header */}
        <header className="shrink-0 flex items-center justify-between px-8 py-3 bg-white border-b border-gray-200">
          <div>
            <h1 className="text-base font-semibold text-gray-900">神山町 天気確率予報</h1>
            <p className="text-xs text-gray-400">気象庁の過去30年分データに基づく統計</p>
          </div>
          <span className="text-xs text-gray-400">{CURRENT_YEAR}年</span>
        </header>

        {/* Body */}
        <div className="flex flex-1 min-h-0 p-6 gap-6">

          {/* Left: calendar — fills height */}
          <div className="w-1/2 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 p-6 gap-4">
            {/* Month pills */}
            <div className="flex gap-1.5 flex-wrap shrink-0">
              {MONTHS.map((label, i) => {
                const m = i + 1;
                return (
                  <button
                    key={m}
                    onClick={() => setSelectedMonth(m)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
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
            <div className="text-xl font-bold text-gray-900 shrink-0">{selectedMonth}月</div>

            {/* Weekday header */}
            <div className="grid grid-cols-7 text-center shrink-0">
              {WEEKDAYS.map((d, i) => (
                <div key={d} className={`text-sm font-medium py-1 ${
                  i === 5 ? "text-blue-400" : i === 6 ? "text-red-400" : "text-gray-400"
                }`}>{d}</div>
              ))}
            </div>

            {/* Day grid — flex-1 so buttons stretch to fill */}
            <div className="grid grid-cols-7 flex-1 auto-rows-fr gap-1">
              {dayGrid.map((d, idx) => {
                if (d === null) return <div key={`e-${idx}`} />;
                const col = (startOffset + d - 1) % 7;
                const isSat = col === 5;
                const isSun = col === 6;
                const isSelected = adjustedDay === d;
                return (
                  <button
                    key={d}
                    onClick={() => setSelectedDay(d)}
                    className={`rounded-xl text-base font-medium transition-all flex items-center justify-center w-full h-full ${
                      isSelected
                        ? "bg-green-600 text-white shadow"
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
            <div className="text-xl font-bold text-gray-900 shrink-0">
              {selectedMonth}月 {adjustedDay}日
              <span className="text-sm font-normal text-gray-400 ml-2">の過去30年統計</span>
            </div>

            {!stats && (
              <div className="flex-1 flex items-center justify-center text-gray-400">読み込み中...</div>
            )}

            {stats && result && (
              <div className="flex flex-col gap-4 flex-1 min-h-0">
                {/* Rain */}
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex items-center gap-6">
                  <div className="relative w-20 h-20 shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15" fill="none" stroke="#e0e7ff" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15" fill="none" stroke="#3b82f6" strokeWidth="3"
                        strokeDasharray={`${(result.rain_probability / 100) * 94.2} 94.2`}
                        strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-700">{result.rain_probability}%</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Droplets className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-semibold text-gray-600">降水確率</span>
                    </div>
                    <p className="text-4xl font-bold text-blue-700">{result.rain_probability}%</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {result.rain_probability >= 60 ? "雨が降りやすい日" :
                       result.rain_probability >= 30 ? "雨の可能性あり" : "晴れやすい日"}
                    </p>
                  </div>
                </div>

                {/* Temp */}
                {result.average_temperature !== null && (
                  <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex items-center gap-6">
                    <div className="w-20 h-20 shrink-0 flex items-center justify-center rounded-full bg-orange-50">
                      <Thermometer className="w-9 h-9 text-orange-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-sm font-semibold text-gray-600">平均気温</span>
                      </div>
                      <p className="text-4xl font-bold text-orange-600">{result.average_temperature}°C</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {result.average_temperature >= 25 ? "暑い日" :
                         result.average_temperature >= 15 ? "過ごしやすい" :
                         result.average_temperature >= 5  ? "肌寒い日" : "寒い日"}
                      </p>
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-400 shrink-0">
                  過去{result.years_analyzed}年分 / 穴吹観測点（神山町周辺）
                </p>
              </div>
            )}

            {stats && !result && (
              <div className="flex-1 flex items-center justify-center text-gray-400">日付を選択してください</div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Mobile layout (〜md): scrollable ─── */}
      <div className="md:hidden min-h-screen bg-gray-50 flex flex-col text-gray-800">
        {/* Header */}
        <header className="shrink-0 flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200">
          <div>
            <h1 className="text-sm font-semibold text-gray-900">神山町 天気確率予報</h1>
            <p className="text-xs text-gray-400">気象庁の過去30年分データに基づく統計</p>
          </div>
          <span className="text-xs text-gray-400">{CURRENT_YEAR}年</span>
        </header>

        <div className="p-4 flex flex-col gap-4">
          {/* Calendar card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex flex-col gap-3">
            {/* Month pills */}
            <div className="flex gap-1 flex-wrap">
              {MONTHS.map((label, i) => {
                const m = i + 1;
                return (
                  <button key={m} onClick={() => setSelectedMonth(m)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                      selectedMonth === m ? "bg-green-600 text-white" : "text-gray-500 hover:bg-gray-100"
                    }`}>
                    {label}月
                  </button>
                );
              })}
            </div>

            <div className="text-base font-bold text-gray-900">{selectedMonth}月</div>

            <div className="grid grid-cols-7 text-center">
              {WEEKDAYS.map((d, i) => (
                <div key={d} className={`text-xs font-medium py-0.5 ${
                  i === 5 ? "text-blue-400" : i === 6 ? "text-red-400" : "text-gray-400"
                }`}>{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-y-1">
              {dayGrid.map((d, idx) => {
                if (d === null) return <div key={`e-${idx}`} />;
                const col = (startOffset + d - 1) % 7;
                const isSelected = adjustedDay === d;
                const isSat = col === 5;
                const isSun = col === 6;
                return (
                  <button key={d} onClick={() => setSelectedDay(d)}
                    className={`mx-auto w-9 h-9 rounded-full text-sm flex items-center justify-center font-medium transition-all ${
                      isSelected ? "bg-green-600 text-white shadow" :
                      isSun ? "text-red-400 hover:bg-red-50" :
                      isSat ? "text-blue-400 hover:bg-blue-50" :
                      "text-gray-700 hover:bg-gray-100"
                    }`}>
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Result */}
          <div>
            <div className="text-base font-bold text-gray-900 mb-3">
              {selectedMonth}月 {adjustedDay}日
              <span className="text-xs font-normal text-gray-400 ml-2">の過去30年統計</span>
            </div>

            {!stats && <p className="text-center text-gray-400 text-sm py-6">読み込み中...</p>}

            {stats && result && (
              <div className="flex flex-col gap-3">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex items-center gap-4">
                  <div className="relative w-14 h-14 shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15" fill="none" stroke="#e0e7ff" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15" fill="none" stroke="#3b82f6" strokeWidth="3"
                        strokeDasharray={`${(result.rain_probability / 100) * 94.2} 94.2`}
                        strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-blue-700">{result.rain_probability}%</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-0.5">
                      <Droplets className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-xs font-semibold text-gray-600">降水確率</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-700">{result.rain_probability}%</p>
                    <p className="text-xs text-gray-400">
                      {result.rain_probability >= 60 ? "雨が降りやすい日" :
                       result.rain_probability >= 30 ? "雨の可能性あり" : "晴れやすい日"}
                    </p>
                  </div>
                </div>

                {result.average_temperature !== null && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex items-center gap-4">
                    <div className="w-14 h-14 shrink-0 flex items-center justify-center rounded-full bg-orange-50">
                      <Thermometer className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className="text-xs font-semibold text-gray-600">平均気温</span>
                      </div>
                      <p className="text-2xl font-bold text-orange-600">{result.average_temperature}°C</p>
                      <p className="text-xs text-gray-400">
                        {result.average_temperature >= 25 ? "暑い日" :
                         result.average_temperature >= 15 ? "過ごしやすい" :
                         result.average_temperature >= 5  ? "肌寒い日" : "寒い日"}
                      </p>
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-400 pb-2">
                  過去{result.years_analyzed}年分 / 穴吹観測点（神山町周辺）
                </p>
              </div>
            )}

            {stats && !result && (
              <p className="text-center text-gray-400 text-sm py-6">日付を選択してください</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
