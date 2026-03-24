import { useEffect, useState } from "react";
import { Droplets, Sun, Thermometer, TrendingUp, BarChart2 } from "lucide-react";

interface WeatherStats {
  [month: string]: {
    [day: string]: {
      rain_probability: number;
      clear_probability: number;
      rain_rank_in_month: number;
      rain_diff_from_monthly_avg: number;
      average_temperature: number | null;
      temp_diff_from_monthly_avg: number | null;
      temp_percentile: number | null;
      years_analyzed: number;
    };
  };
}

const MONTHS = ["1","2","3","4","5","6","7","8","9","10","11","12"];
const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const WEEKDAYS = ["月","火","水","木","金","土","日"];

const today = new Date();
const CURRENT_YEAR = today.getFullYear();

function DiffBadge({ value, unit = "%" }: { value: number; unit?: string }) {
  const positive = value > 0;
  const zero = value === 0;
  return (
    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
      zero ? "bg-gray-100 text-gray-400" :
      positive ? "bg-red-50 text-red-500" : "bg-green-50 text-green-600"
    }`}>
      {positive ? "+" : ""}{value}{unit}
    </span>
  );
}

function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
      <div className={`h-1.5 rounded-full transition-all duration-500 ${color}`} style={{ width: `${value}%` }} />
    </div>
  );
}

// ── PC Result Panel ──────────────────────────────────────────
function ResultPanel({ result, month, day }: { result: WeatherStats[string][string]; month: number; day: number }) {
  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="text-base font-bold text-gray-900">
        {month}月 {day}日
        <span className="text-xs font-normal text-gray-400 ml-2">の過去30年統計</span>
      </div>

      {/* 上段: 降水 + 快晴 */}
      <div className="flex gap-3 flex-1 min-h-0">
        {/* 降水確率 */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex flex-col justify-between">
          <div className="flex items-center gap-1.5">
            <Droplets className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-semibold text-gray-500">降水確率</span>
          </div>
          <div>
            <p className="text-3xl font-bold text-blue-700">{result.rain_probability}%</p>
            <MiniBar value={result.rain_probability} color="bg-blue-400" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400">月平均比</span>
            <DiffBadge value={result.rain_diff_from_monthly_avg} />
          </div>
        </div>

        {/* 快晴確率 */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex flex-col justify-between">
          <div className="flex items-center gap-1.5">
            <Sun className="w-4 h-4 text-yellow-500" />
            <span className="text-xs font-semibold text-gray-500">快晴確率</span>
          </div>
          <div>
            <p className="text-3xl font-bold text-yellow-600">{result.clear_probability}%</p>
            <MiniBar value={result.clear_probability} color="bg-yellow-400" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400">月内ランク</span>
            <span className="text-xs font-medium text-gray-500">
              雨の多さ {result.rain_rank_in_month}位/100
            </span>
          </div>
        </div>
      </div>

      {/* 下段: 気温 + 年間位置 */}
      <div className="flex gap-3 flex-1 min-h-0">
        {/* 平均気温 */}
        {result.average_temperature !== null && (
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex flex-col justify-between">
            <div className="flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-semibold text-gray-500">平均気温</span>
            </div>
            <div>
              <p className="text-3xl font-bold text-orange-600">{result.average_temperature}°C</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400">月平均比</span>
              <DiffBadge value={result.temp_diff_from_monthly_avg ?? 0} unit="°C" />
            </div>
          </div>
        )}

        {/* 年間気温位置 */}
        {result.temp_percentile !== null && (
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex flex-col justify-between">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-semibold text-gray-500">年間気温位置</span>
            </div>
            <div>
              <p className="text-3xl font-bold text-purple-600">{result.temp_percentile}<span className="text-sm font-normal text-gray-400">%ile</span></p>
              <MiniBar value={result.temp_percentile} color="bg-purple-400" />
            </div>
            <p className="text-xs text-gray-400">
              {result.temp_percentile >= 80 ? "年間でも暑い時期" :
               result.temp_percentile >= 50 ? "年間で暖かい時期" :
               result.temp_percentile >= 20 ? "年間で涼しい時期" : "年間でも寒い時期"}
            </p>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 shrink-0">
        過去{result.years_analyzed}年分 / 穴吹観測点（神山町周辺）
      </p>
    </div>
  );
}

// ── Mobile Result Cards ──────────────────────────────────────
function MobileResult({ result }: { result: WeatherStats[string][string] }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        {/* 降水確率 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-1 mb-2">
            <Droplets className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-xs font-semibold text-gray-500">降水確率</span>
          </div>
          <p className="text-2xl font-bold text-blue-700">{result.rain_probability}%</p>
          <MiniBar value={result.rain_probability} color="bg-blue-400" />
          <div className="mt-2"><DiffBadge value={result.rain_diff_from_monthly_avg} /></div>
        </div>

        {/* 快晴確率 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-1 mb-2">
            <Sun className="w-3.5 h-3.5 text-yellow-500" />
            <span className="text-xs font-semibold text-gray-500">快晴確率</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600">{result.clear_probability}%</p>
          <MiniBar value={result.clear_probability} color="bg-yellow-400" />
          <p className="text-xs text-gray-400 mt-2">月内 雨{result.rain_rank_in_month}%ile</p>
        </div>

        {/* 平均気温 */}
        {result.average_temperature !== null && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-1 mb-2">
              <Thermometer className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-xs font-semibold text-gray-500">平均気温</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">{result.average_temperature}°C</p>
            <div className="mt-2"><DiffBadge value={result.temp_diff_from_monthly_avg ?? 0} unit="°C" /></div>
          </div>
        )}

        {/* 年間気温位置 */}
        {result.temp_percentile !== null && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-1 mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs font-semibold text-gray-500">年間気温位置</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">{result.temp_percentile}<span className="text-xs font-normal text-gray-400">%ile</span></p>
            <MiniBar value={result.temp_percentile} color="bg-purple-400" />
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400">
        過去{result.years_analyzed}年分 / 穴吹観測点（神山町周辺）
      </p>
    </div>
  );
}

// ── Calendar ─────────────────────────────────────────────────
function Calendar({
  selectedMonth, selectedDay,
  onMonthChange, onDayChange,
  isMobile = false,
}: {
  selectedMonth: number; selectedDay: number;
  onMonthChange: (m: number) => void; onDayChange: (d: number) => void;
  isMobile?: boolean;
}) {
  const maxDays = DAYS_IN_MONTH[selectedMonth - 1];
  const adjustedDay = Math.min(selectedDay, maxDays);
  const firstDow = new Date(CURRENT_YEAR, selectedMonth - 1, 1).getDay();
  const startOffset = firstDow === 0 ? 6 : firstDow - 1;
  const dayGrid: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) dayGrid.push(null);
  for (let d = 1; d <= maxDays; d++) dayGrid.push(d);

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col gap-3 ${isMobile ? "p-4" : "p-6 h-full"}`}>
      {/* Month pills */}
      <div className="flex gap-1 flex-wrap shrink-0">
        {MONTHS.map((label, i) => {
          const m = i + 1;
          return (
            <button key={m} onClick={() => onMonthChange(m)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                selectedMonth === m ? "bg-green-600 text-white" : "text-gray-500 hover:bg-gray-100"
              }`}>
              {label}月
            </button>
          );
        })}
      </div>

      <div className={`font-bold text-gray-900 shrink-0 ${isMobile ? "text-base" : "text-xl"}`}>
        {selectedMonth}月
      </div>

      <div className="grid grid-cols-7 text-center shrink-0">
        {WEEKDAYS.map((d, i) => (
          <div key={d} className={`font-medium py-0.5 ${isMobile ? "text-xs" : "text-sm"} ${
            i === 5 ? "text-blue-400" : i === 6 ? "text-red-400" : "text-gray-400"
          }`}>{d}</div>
        ))}
      </div>

      <div className={`grid grid-cols-7 ${isMobile ? "gap-y-1" : "flex-1 auto-rows-fr gap-1"}`}>
        {dayGrid.map((d, idx) => {
          if (d === null) return <div key={`e-${idx}`} />;
          const col = (startOffset + d - 1) % 7;
          const isSelected = adjustedDay === d;
          const isSat = col === 5;
          const isSun = col === 6;
          return (
            <button key={d} onClick={() => onDayChange(d)}
              className={`flex items-center justify-center font-medium transition-all
                ${isMobile ? "mx-auto w-9 h-9 rounded-full text-sm" : "rounded-xl text-base w-full h-full"}
                ${isSelected ? "bg-green-600 text-white shadow" :
                  isSun ? "text-red-400 hover:bg-red-50" :
                  isSat ? "text-blue-400 hover:bg-blue-50" :
                  "text-gray-700 hover:bg-gray-100"}`}>
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────
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

  const headerEl = (
    <header className="shrink-0 flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
      <div>
        <h1 className="text-base font-semibold text-gray-900">神山町 天気確率予報</h1>
        <p className="text-xs text-gray-400">気象庁の過去30年分データに基づく統計</p>
      </div>
      <span className="text-xs text-gray-400">{CURRENT_YEAR}年</span>
    </header>
  );

  return (
    <>
      {/* ── PC ── */}
      <div className="hidden md:flex h-screen flex-col bg-gray-50 overflow-hidden">
        {headerEl}
        <div className="flex flex-1 min-h-0 p-5 gap-5">
          <div className="w-5/12">
            <Calendar
              selectedMonth={selectedMonth} selectedDay={selectedDay}
              onMonthChange={setSelectedMonth} onDayChange={setSelectedDay}
            />
          </div>
          <div className="flex-1 flex flex-col min-h-0">
            {!stats && <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">読み込み中...</div>}
            {stats && result && <ResultPanel result={result} month={selectedMonth} day={adjustedDay} />}
            {stats && !result && <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">日付を選択してください</div>}
          </div>
        </div>
      </div>

      {/* ── Mobile ── */}
      <div className="md:hidden min-h-screen bg-gray-50 flex flex-col">
        {headerEl}
        <div className="p-4 flex flex-col gap-4">
          <Calendar
            selectedMonth={selectedMonth} selectedDay={selectedDay}
            onMonthChange={setSelectedMonth} onDayChange={setSelectedDay}
            isMobile
          />
          <div>
            <div className="text-base font-bold text-gray-900 mb-3">
              {selectedMonth}月 {adjustedDay}日
              <span className="text-xs font-normal text-gray-400 ml-2">の過去30年統計</span>
            </div>
            {!stats && <p className="text-center text-gray-400 text-sm py-6">読み込み中...</p>}
            {stats && result && <MobileResult result={result} />}
            {stats && !result && <p className="text-center text-gray-400 text-sm py-6">日付を選択してください</p>}
          </div>
        </div>
      </div>
    </>
  );
}
