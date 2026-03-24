import { useEffect, useState, useMemo } from "react";
import { Droplets, Sun, Thermometer, TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";

interface DayStats {
  rain_probability: number;
  clear_probability: number;
  rain_rank_in_month: number;
  rain_diff_from_monthly_avg: number;
  average_temperature: number | null;
  temp_diff_from_monthly_avg: number | null;
  temp_percentile: number | null;
  years_analyzed: number;
}

interface WeatherStats {
  [month: string]: { [day: string]: DayStats };
}

const MONTHS = ["1","2","3","4","5","6","7","8","9","10","11","12"];
const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const WEEKDAYS = ["月","火","水","木","金","土","日"];
const today = new Date();
const CURRENT_YEAR = today.getFullYear();

// ── helpers ──────────────────────────────────────────────────
function DiffBadge({ value, unit = "%" }: { value: number; unit?: string }) {
  const pos = value > 0, zero = value === 0;
  return (
    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
      zero ? "bg-gray-100 text-gray-400" :
      pos  ? "bg-red-50 text-red-500" : "bg-green-50 text-green-600"
    }`}>
      {pos ? "+" : ""}{value}{unit}
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

// ── Monthly trend chart ───────────────────────────────────────
function MonthTrendChart({
  stats, month, selectedDay,
}: {
  stats: WeatherStats; month: number; selectedDay: number;
}) {
  const data = useMemo(() => {
    const mk = String(month);
    const days = DAYS_IN_MONTH[month - 1];
    return Array.from({ length: days }, (_, i) => {
      const d = i + 1;
      const e = stats[mk]?.[String(d)];
      return {
        day: d,
        rain: e?.rain_probability ?? null,
        temp: e?.average_temperature ?? null,
      };
    });
  }, [stats, month]);

  const maxDays = DAYS_IN_MONTH[month - 1];
  const sd = Math.min(selectedDay, maxDays);

  return (
    <div className="flex flex-col gap-2 h-full">
      {/* 降水確率推移 */}
      <div className="flex-1 min-h-0">
        <p className="text-xs text-gray-400 font-medium mb-1 flex items-center gap-1">
          <Droplets className="w-3 h-3 text-blue-400" /> {month}月の降水確率推移
        </p>
        <ResponsiveContainer width="100%" height="85%">
          <AreaChart data={data} margin={{ top: 2, right: 8, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="rainGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fontSize: 9, fill: "#9ca3af" }} tickLine={false} axisLine={false} interval={4} />
            <YAxis tick={{ fontSize: 9, fill: "#9ca3af" }} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb", padding: "4px 8px" }}
              formatter={(v: number) => [`${v}%`, "降水確率"]}
              labelFormatter={(l) => `${month}月${l}日`}
            />
            <ReferenceLine x={sd} stroke="#16a34a" strokeWidth={1.5} strokeDasharray="3 3" />
            <Area type="monotone" dataKey="rain" stroke="#3b82f6" strokeWidth={1.5} fill="url(#rainGrad)" dot={false} connectNulls />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 気温推移 */}
      <div className="flex-1 min-h-0">
        <p className="text-xs text-gray-400 font-medium mb-1 flex items-center gap-1">
          <Thermometer className="w-3 h-3 text-orange-400" /> {month}月の平均気温推移
        </p>
        <ResponsiveContainer width="100%" height="85%">
          <AreaChart data={data} margin={{ top: 2, right: 8, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fb923c" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#fb923c" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fontSize: 9, fill: "#9ca3af" }} tickLine={false} axisLine={false} interval={4} />
            <YAxis tick={{ fontSize: 9, fill: "#9ca3af" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}°`} />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb", padding: "4px 8px" }}
              formatter={(v: number) => [`${v}°C`, "平均気温"]}
              labelFormatter={(l) => `${month}月${l}日`}
            />
            <ReferenceLine x={sd} stroke="#16a34a" strokeWidth={1.5} strokeDasharray="3 3" />
            <Area type="monotone" dataKey="temp" stroke="#f97316" strokeWidth={1.5} fill="url(#tempGrad)" dot={false} connectNulls />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Calendar ─────────────────────────────────────────────────
function Calendar({
  selectedMonth, selectedDay, onMonthChange, onDayChange, isMobile = false,
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
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col gap-2 ${isMobile ? "p-4" : "p-4 h-full"}`}>
      <div className="flex gap-1 flex-wrap shrink-0">
        {MONTHS.map((label, i) => {
          const m = i + 1;
          return (
            <button key={m} onClick={() => onMonthChange(m)}
              className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${
                selectedMonth === m ? "bg-green-600 text-white" : "text-gray-500 hover:bg-gray-100"
              }`}>
              {label}月
            </button>
          );
        })}
      </div>

      <div className="text-sm font-bold text-gray-700 shrink-0">{selectedMonth}月</div>

      <div className="grid grid-cols-7 text-center shrink-0">
        {WEEKDAYS.map((d, i) => (
          <div key={d} className={`text-xs font-medium py-0.5 ${
            i === 5 ? "text-blue-400" : i === 6 ? "text-red-400" : "text-gray-400"
          }`}>{d}</div>
        ))}
      </div>

      <div className={`grid grid-cols-7 ${isMobile ? "gap-y-1" : "gap-y-0.5 flex-1 content-start"}`}>
        {dayGrid.map((d, idx) => {
          if (d === null) return <div key={`e-${idx}`} />;
          const col = (startOffset + d - 1) % 7;
          const isSelected = adjustedDay === d;
          const isSat = col === 5, isSun = col === 6;
          return (
            <button key={d} onClick={() => onDayChange(d)}
              className={`mx-auto flex items-center justify-center font-medium transition-all rounded-full text-sm
                ${isMobile ? "w-9 h-9" : "w-8 h-8"}
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

// ── Stats Cards ───────────────────────────────────────────────
function StatsCards({ result, month, day, mobile = false }: { result: DayStats; month: number; day: number; mobile?: boolean }) {
  const grid = mobile ? "grid grid-cols-2 gap-3" : "grid grid-cols-2 gap-3 h-full";
  return (
    <div className={grid}>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex flex-col justify-between">
        <div className="flex items-center gap-1.5"><Droplets className="w-4 h-4 text-blue-500" /><span className="text-xs font-semibold text-gray-500">降水確率</span></div>
        <div><p className="text-3xl font-bold text-blue-700">{result.rain_probability}%</p><MiniBar value={result.rain_probability} color="bg-blue-400" /></div>
        <div className="flex items-center gap-1.5"><span className="text-xs text-gray-400">月平均比</span><DiffBadge value={result.rain_diff_from_monthly_avg} /></div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex flex-col justify-between">
        <div className="flex items-center gap-1.5"><Sun className="w-4 h-4 text-yellow-500" /><span className="text-xs font-semibold text-gray-500">快晴確率</span></div>
        <div><p className="text-3xl font-bold text-yellow-600">{result.clear_probability}%</p><MiniBar value={result.clear_probability} color="bg-yellow-400" /></div>
        <p className="text-xs text-gray-400">月内 雨{result.rain_rank_in_month}%ile</p>
      </div>

      {result.average_temperature !== null && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex flex-col justify-between">
          <div className="flex items-center gap-1.5"><Thermometer className="w-4 h-4 text-orange-400" /><span className="text-xs font-semibold text-gray-500">平均気温</span></div>
          <div><p className="text-3xl font-bold text-orange-600">{result.average_temperature}°C</p></div>
          <div className="flex items-center gap-1.5"><span className="text-xs text-gray-400">月平均比</span><DiffBadge value={result.temp_diff_from_monthly_avg ?? 0} unit="°C" /></div>
        </div>
      )}

      {result.temp_percentile !== null && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex flex-col justify-between">
          <div className="flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-purple-400" /><span className="text-xs font-semibold text-gray-500">年間気温位置</span></div>
          <div><p className="text-3xl font-bold text-purple-600">{result.temp_percentile}<span className="text-sm font-normal text-gray-400">%ile</span></p><MiniBar value={result.temp_percentile} color="bg-purple-400" /></div>
          <p className="text-xs text-gray-400">{result.temp_percentile >= 75 ? "年間でも暑い" : result.temp_percentile >= 50 ? "やや暖かい" : result.temp_percentile >= 25 ? "やや涼しい" : "年間でも寒い"}</p>
        </div>
      )}
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

  const header = (
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
        {header}
        <div className="flex flex-1 min-h-0 p-4 gap-4">

          {/* 左列: カレンダー(上半分) + グラフ(下半分) */}
          <div className="w-5/12 flex flex-col gap-4 min-h-0">
            <div className="flex-1 min-h-0">
              <Calendar
                selectedMonth={selectedMonth} selectedDay={selectedDay}
                onMonthChange={setSelectedMonth} onDayChange={setSelectedDay}
              />
            </div>
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-4 min-h-0">
              {stats
                ? <MonthTrendChart stats={stats} month={selectedMonth} selectedDay={adjustedDay} />
                : <div className="h-full flex items-center justify-center text-gray-400 text-xs">読み込み中...</div>
              }
            </div>
          </div>

          {/* 右列: 統計カード */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="text-sm font-bold text-gray-900 mb-3 shrink-0">
              {selectedMonth}月 {adjustedDay}日
              <span className="text-xs font-normal text-gray-400 ml-2">の過去30年統計</span>
            </div>
            {!stats && <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">読み込み中...</div>}
            {stats && result && <div className="flex-1 min-h-0"><StatsCards result={result} month={selectedMonth} day={adjustedDay} /></div>}
            {stats && !result && <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">日付を選択してください</div>}
          </div>
        </div>
      </div>

      {/* ── Mobile ── */}
      <div className="md:hidden min-h-screen bg-gray-50 flex flex-col">
        {header}
        <div className="p-4 flex flex-col gap-4">
          <Calendar
            selectedMonth={selectedMonth} selectedDay={selectedDay}
            onMonthChange={setSelectedMonth} onDayChange={setSelectedDay}
            isMobile
          />

          {/* グラフ */}
          {stats && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4" style={{ height: 240 }}>
              <MonthTrendChart stats={stats} month={selectedMonth} selectedDay={adjustedDay} />
            </div>
          )}

          {/* 統計カード */}
          <div>
            <div className="text-base font-bold text-gray-900 mb-3">
              {selectedMonth}月 {adjustedDay}日
              <span className="text-xs font-normal text-gray-400 ml-2">の過去30年統計</span>
            </div>
            {!stats && <p className="text-center text-gray-400 text-sm py-6">読み込み中...</p>}
            {stats && result && <StatsCards result={result} month={selectedMonth} day={adjustedDay} mobile />}
            {stats && !result && <p className="text-center text-gray-400 text-sm py-6">日付を選択してください</p>}
          </div>
        </div>
      </div>
    </>
  );
}
