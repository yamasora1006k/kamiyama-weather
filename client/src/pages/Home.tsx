import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
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

const MONTHS = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月"
];

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export default function Home() {
  const [stats, setStats] = useState<WeatherStats | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(3);
  const [selectedDay, setSelectedDay] = useState(24);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}weather_stats.json`)
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error("Failed to load weather stats:", err));
  }, []);

  const maxDays = DAYS_IN_MONTH[selectedMonth - 1];
  const adjustedDay = Math.min(selectedDay, maxDays);

  const result = stats?.[selectedMonth.toString()]?.[adjustedDay.toString()] ?? null;

  // Build day grid: pad to start from correct weekday (Mon=0 ... Sun=6)
  // Use a simple 7-col grid starting from 1
  const dayGrid: (number | null)[] = [];
  // Get day-of-week for the 1st of the month (using year 2024 as reference for leap year)
  const firstDow = new Date(2024, selectedMonth - 1, 1).getDay(); // 0=Sun
  const startOffset = firstDow === 0 ? 6 : firstDow - 1; // Mon-based
  for (let i = 0; i < startOffset; i++) dayGrid.push(null);
  for (let d = 1; d <= maxDays; d++) dayGrid.push(d);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-green-200 sticky top-0 z-50">
        <div className="container py-6">
          <h1 className="text-3xl font-bold text-green-900">神山町 天気確率予報</h1>
          <p className="text-gray-600 text-sm mt-1">気象庁の過去30年分データから、その日の天気確率を予測します</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-12">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Search Panel */}
          <Card className="p-8 bg-white/90 backdrop-blur-sm border-green-200 shadow-lg">
            <h2 className="text-2xl font-bold text-green-900 mb-6">日付を選択</h2>

            {/* Month Selection */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-700 mb-3">月</p>
              <div className="grid grid-cols-6 gap-2">
                {MONTHS.map((label, i) => {
                  const m = i + 1;
                  return (
                    <button
                      key={m}
                      onClick={() => {
                        setSelectedMonth(m);
                      }}
                      className={`py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedMonth === m
                          ? "bg-green-700 text-white shadow"
                          : "bg-gray-100 text-gray-700 hover:bg-green-100"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Day Selection — calendar grid */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">日</p>
              {/* Weekday headers */}
              <div className="grid grid-cols-7 mb-1">
                {["月", "火", "水", "木", "金", "土", "日"].map((d) => (
                  <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {dayGrid.map((d, idx) =>
                  d === null ? (
                    <div key={`empty-${idx}`} />
                  ) : (
                    <button
                      key={d}
                      onClick={() => {
                        setSelectedDay(d);
                      }}
                      className={`aspect-square rounded-lg text-sm font-medium transition-all ${
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

          </Card>

          {/* Result Panel */}
          <div>
            {result && (
              <Card className="p-8 bg-white/90 backdrop-blur-sm border-green-200 shadow-lg animate-in fade-in duration-300">
                <h2 className="text-2xl font-bold text-green-900 mb-6">
                  {MONTHS[selectedMonth - 1]} {adjustedDay}日の天気
                </h2>

                <div className="space-y-6">
                  {/* Rain Probability */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <Droplets className="w-6 h-6 text-blue-600" />
                      <h3 className="text-lg font-semibold text-blue-900">降水確率</h3>
                    </div>
                    <div className="relative w-32 h-32 mx-auto">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#e0e7ff" strokeWidth="8" />
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke="#2563eb"
                          strokeWidth="8"
                          strokeDasharray={`${(result.rain_probability / 100) * 282.7} 282.7`}
                          strokeLinecap="round"
                          transform="rotate(-90 50 50)"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl font-bold text-blue-900">{result.rain_probability}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Temperature */}
                  {result.average_temperature !== null && (
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg">
                      <div className="flex items-center gap-3 mb-4">
                        <Thermometer className="w-6 h-6 text-orange-600" />
                        <h3 className="text-lg font-semibold text-orange-900">平均気温</h3>
                      </div>
                      <p className="text-4xl font-bold text-orange-900">{result.average_temperature}°C</p>
                    </div>
                  )}

                  {/* Data Info */}
                  <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
                    <p>※ このデータは気象庁の過去 <strong>{result.years_analyzed}年分</strong> の観測データに基づいています</p>
                    <p>※ 穴吹観測点（神山町周辺）のデータを使用しています</p>
                  </div>
                </div>
              </Card>
            )}

            {!result && (
              <Card className="p-8 bg-white/90 backdrop-blur-sm border-green-200 shadow-lg text-center">
                <p className="text-gray-500">
                  {!stats ? "データを読み込み中..." : "左側で日付を選択してください"}
                </p>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-green-200 mt-12">
        <div className="container py-6 text-center text-sm text-gray-600">
          <p>データソース: 気象庁 | 観測地点: 穴吹（徳島県名西郡神山町周辺）</p>
          <p>過去30年分（1996年～2025年）のデータを分析しています</p>
        </div>
      </footer>
    </div>
  );
}
