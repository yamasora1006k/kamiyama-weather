"""
weather_stats.json 生成スクリプト
- 改善①: ±3日移動平均（前後3日のデータを合算してサンプル数を増やす）
- 改善②: 近年重み付け（直近10年を2倍、中間10年を1.5倍、古い10年を1倍）
- 追加③: 月平均との比較・快晴確率・年間気温ランクなどの派生指標
"""

import json
from datetime import date, timedelta

# ── 元データ読み込み（オリジナルの30年単純集計） ────────────────
# まず元のシンプルなデータが必要なので、一時的にオリジナルを読む
# ※ このスクリプトを2回目以降実行する場合はoriginal_stats.jsonを参照
import os
ORIGINAL_PATH = "client/public/original_stats.json"
OUTPUT_PATH   = "client/public/weather_stats.json"

if os.path.exists(ORIGINAL_PATH):
    with open(ORIGINAL_PATH) as f:
        original = json.load(f)
else:
    # 初回: 現在のweather_stats.jsonをoriginalとして保存
    with open(OUTPUT_PATH) as f:
        original = json.load(f)
    with open(ORIGINAL_PATH, "w") as f:
        json.dump(original, f, ensure_ascii=False, indent=2)
    print(f"元データを {ORIGINAL_PATH} に保存しました")

# ── ヘルパー ─────────────────────────────────────────────────
def get_raw(month: int, day: int):
    m, d = str(month), str(day)
    if m not in original or d not in original[m]:
        return None
    e = original[m][d]
    total = e["years_analyzed"]
    rain_count = round(e["rain_probability"] / 100 * total)
    return rain_count, total

def all_dates():
    base = date(2024, 1, 1)
    return [base + timedelta(days=i) for i in range(366)]

def neighbors(dt: date, window=3):
    return [dt + timedelta(days=i) for i in range(-window, window + 1)]

def weighted_rain_total(rain_count: int, total_years: int):
    if total_years == 30:
        pg = rain_count / 3.0
        w_rain  = pg * 1.0 + pg * 1.5 + pg * 2.0  # = rain * 1.5
        w_total = (total_years / 3.0) * (1.0 + 1.5 + 2.0)  # = 45
        return w_rain, w_total
    else:
        return float(rain_count), float(total_years)

# ── Step1: ±3日移動平均 + 近年重み付けで基本確率を計算 ────────
base_output = {}
dates = all_dates()

for dt in dates:
    m_key, d_key = str(dt.month), str(dt.day)
    temp_vals = []
    total_w_rain = total_w_total = 0.0

    for nb in neighbors(dt, window=3):
        raw = get_raw(nb.month, nb.day)
        if raw is None:
            continue
        rain_count, total_years = raw
        w_rain, w_total = weighted_rain_total(rain_count, total_years)
        total_w_rain  += w_rain
        total_w_total += w_total
        nm, nd = str(nb.month), str(nb.day)
        if nm in original and nd in original[nm]:
            t = original[nm][nd].get("average_temperature")
            if t is not None:
                temp_vals.append(t)

    if total_w_total == 0:
        continue

    new_prob = round(total_w_rain / total_w_total * 100, 1)
    new_temp = round(sum(temp_vals) / len(temp_vals), 1) if temp_vals else None

    neighbor_years = [get_raw(nb.month, nb.day)[1] for nb in neighbors(dt, 3) if get_raw(nb.month, nb.day)]
    eff_years = round(sum(neighbor_years) / len(neighbor_years)) if neighbor_years else 30

    if m_key not in base_output:
        base_output[m_key] = {}
    base_output[m_key][d_key] = {
        "rain_probability": new_prob,
        "average_temperature": new_temp,
        "years_analyzed": eff_years,
    }

# ── Step2: 月別・年間統計を計算 ──────────────────────────────
monthly_probs = {}
monthly_temps = {}
for m in range(1, 13):
    mk = str(m)
    probs = [base_output[mk][d]["rain_probability"] for d in base_output.get(mk, {})]
    temps = [base_output[mk][d]["average_temperature"] for d in base_output.get(mk, {})
             if base_output[mk][d]["average_temperature"] is not None]
    monthly_probs[m] = {"min": min(probs), "max": max(probs), "avg": round(sum(probs)/len(probs), 1)} if probs else {}
    monthly_temps[m] = {"min": min(temps), "max": max(temps), "avg": round(sum(temps)/len(temps), 1)} if temps else {}

all_temps_flat = [base_output[m][d]["average_temperature"]
                  for m in base_output for d in base_output[m]
                  if base_output[m][d]["average_temperature"] is not None]
year_temp_min = min(all_temps_flat)
year_temp_max = max(all_temps_flat)

# ── Step3: 派生指標を各日に付加 ──────────────────────────────
final_output = {}

for dt in dates:
    mk, dk = str(dt.month), str(dt.day)
    if mk not in base_output or dk not in base_output[mk]:
        continue

    e = base_output[mk][dk]
    prob = e["rain_probability"]
    temp = e["average_temperature"]
    m    = dt.month

    # ① 月内の降水確率ランク（0〜100%: 月の中で何%ile か）
    m_probs = sorted([base_output[mk][d]["rain_probability"] for d in base_output.get(mk, {})])
    rank_idx = m_probs.index(prob) if prob in m_probs else 0
    rain_rank_pct = round(rank_idx / max(len(m_probs) - 1, 1) * 100)  # 0=最少, 100=最多

    # ② 快晴確率（降水確率の補数）
    clear_probability = round(100 - prob, 1)

    # ③ 月平均との気温差
    temp_diff_from_monthly_avg = None
    if temp is not None and monthly_temps[m]:
        temp_diff_from_monthly_avg = round(temp - monthly_temps[m]["avg"], 1)

    # ④ 年間での気温パーセンタイル（0=年間最低, 100=年間最高）
    temp_percentile = None
    if temp is not None and year_temp_max != year_temp_min:
        temp_percentile = round((temp - year_temp_min) / (year_temp_max - year_temp_min) * 100)

    # ⑤ 月平均降水確率との比較
    rain_diff_from_monthly_avg = round(prob - monthly_probs[m]["avg"], 1) if monthly_probs[m] else None

    if mk not in final_output:
        final_output[mk] = {}
    final_output[mk][dk] = {
        "rain_probability":            prob,
        "clear_probability":           clear_probability,
        "rain_rank_in_month":          rain_rank_pct,
        "rain_diff_from_monthly_avg":  rain_diff_from_monthly_avg,
        "average_temperature":         temp,
        "temp_diff_from_monthly_avg":  temp_diff_from_monthly_avg,
        "temp_percentile":             temp_percentile,
        "years_analyzed":              e["years_analyzed"],
    }

# ── 出力 ──────────────────────────────────────────────────────
with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
    json.dump(final_output, f, ensure_ascii=False, indent=2)

print(f"\n生成完了: {OUTPUT_PATH}")
print(f"エントリ数: {sum(len(final_output[m]) for m in final_output)}")
print("\n=== サンプル: 3月25日 ===")
print(json.dumps(final_output['3']['25'], indent=2, ensure_ascii=False))
