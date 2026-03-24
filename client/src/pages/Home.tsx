import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Cloud, Droplets, Thermometer } from "lucide-react";

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
  const [selectedMonth, setSelectedMonth] = useState(3); // March
  const [selectedDay, setSelectedDay] = useState(24); // 24th
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load weather stats
    fetch(`${import.meta.env.BASE_URL}weather_stats.json`)
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error("Failed to load weather stats:", err));
  }, []);

  const handleSearch = () => {
    if (!stats) return;
    setLoading(true);
    setTimeout(() => {
      const monthData = stats[selectedMonth.toString()];
      if (monthData && monthData[selectedDay.toString()]) {
        setResult(monthData[selectedDay.toString()]);
      } else {
        setResult(null);
      }
      setLoading(false);
    }, 300);
  };

  const maxDays = DAYS_IN_MONTH[selectedMonth - 1];
  const adjustedDay = Math.min(selectedDay, maxDays);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-green-200 sticky top-0 z-50">
        <div className="container py-6">
          <div className="flex items-center gap-3 mb-2">
            <Cloud className="w-8 h-8 text-green-700" />
            <h1 className="text-3xl font-bold text-green-900">神山町 天気確率予報</h1>
          </div>
          <p className="text-gray-600 text-sm">気象庁の過去30年分データから、その日の天気確率を予測します</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-12">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Search Panel */}
          <Card className="p-8 bg-white/90 backdrop-blur-sm border-green-200 shadow-lg">
            <h2 className="text-2xl font-bold text-green-900 mb-6">日付を選択</h2>
            
            <div className="space-y-6">
              {/* Month Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  月: <span className="text-green-700 text-lg">{MONTHS[selectedMonth - 1]}</span>
                </label>
                <Slider
                  value={[selectedMonth]}
                  onValueChange={(val) => setSelectedMonth(val[0])}
                  min={1}
                  max={12}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Day Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  日: <span className="text-green-700 text-lg">{adjustedDay}日</span>
                </label>
                <Slider
                  value={[adjustedDay]}
                  onValueChange={(val) => setSelectedDay(val[0])}
                  min={1}
                  max={maxDays}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>

            {/* Search Button */}
            <Button
              onClick={handleSearch}
              disabled={loading || !stats}
              className="w-full mt-8 bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-lg transition-all"
            >
              {loading ? "検索中..." : "天気確率を表示"}
            </Button>
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
                    <div className="flex items-end gap-4">
                      <div className="flex-1">
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

            {!result && !loading && (
              <Card className="p-8 bg-white/90 backdrop-blur-sm border-green-200 shadow-lg text-center">
                <Cloud className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">左側で日付を選択して、「天気確率を表示」をクリックしてください</p>
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
