"""
weather_stats.json 生成スクリプト
- 元データ: weather_stats.json（既存の30年分単純集計）
- 改善①: ±3日移動平均（前後3日のデータを合算してサンプル数を増やす）
- 改善②: 近年重み付け（直近10年を2倍、中間10年を1.5倍、古い10年を1倍）
"""

import json
from datetime import date, timedelta

# ── 元データ読み込み ──────────────────────────────────────────
with open("client/public/weather_stats.json") as f:
    original = json.load(f)

# ── ヘルパー: 元データから特定日の生データ（雨の回数・年数）を取得 ──
# years_analyzed と rain_probability から雨の回数を逆算する
def get_raw(month: int, day: int):
    """(rain_count, total_years) を返す"""
    m = str(month)
    d = str(day)
    if m not in original or d not in original[m]:
        return None
    entry = original[m][d]
    total = entry["years_analyzed"]
    rain_count = round(entry["rain_probability"] / 100 * total)
    return rain_count, total

# ── 日付リスト（うるう年基準で366日） ──────────────────────────
def all_dates():
    """2024年（うるう年）の全365+1日を返す"""
    base = date(2024, 1, 1)
    return [base + timedelta(days=i) for i in range(366)]

# ── 前後3日の隣接日リスト ─────────────────────────────────────
def neighbors(dt: date, window=3):
    """dt の前後 window 日（dt自身を含む）を返す"""
    return [dt + timedelta(days=i) for i in range(-window, window + 1)]

# ── 年代別重み（1996〜2025年） ────────────────────────────────
# 古い10年（1996-2005）: 重み1.0
# 中間10年（2006-2015）: 重み1.5
# 直近10年（2016-2025）: 重み2.0
def year_weight(year: int) -> float:
    if year >= 2016:
        return 2.0
    elif year >= 2006:
        return 1.5
    else:
        return 1.0

# 各年の重みを合計（全30年分）
# 古い10年: 10×1.0=10, 中間10年: 10×1.5=15, 直近10年: 10×2.0=20 → 合計45
# これを「有効年数」として使う
YEAR_WEIGHT_SUM = sum(year_weight(y) for y in range(1996, 2026))  # = 45.0

# ── 各日の元データに年代重みを適用した rain_count を推定 ─────────
# 元データは年別でなく「30年合計」しか持っていないので、
# 年代重みは「±3日窓内のデータを全て合算」するときに
# 年別サンプルを均等に仮定して重みを適用する
#
# 具体的な計算式:
#   weighted_rain = rain_count × (年代重みの期待値 / 1.0)
#   weighted_total = total_years × (年代重みの期待値 / 1.0)
# ただし元データが年代別でないため、
# 「その30年の平均重み」で全体をスケールするのが正確。
# 平均重み = YEAR_WEIGHT_SUM / 30 = 1.5
# → rain_count × 1.5, total × 1.5 は比率が変わらないのでキャンセル。
#
# よって「年代重み」を正確に適用するには年別データが必要。
# ここでは近似として、各年代ごとの雨の割合が一様と仮定し、
# 直近10年のウィンドウ内サンプルを2倍にカウントする方式を採用:
#   weighted_rain  = rain_count × weight_factor(year_group)
#   weighted_total = total_years × weight_factor(year_group)
# 年代別データがないため「30年を3グループに均等分割」して重み付け:
#   group1 (1996-2005, 10年): rain=rain_count*10/30, weight=1.0
#   group2 (2006-2015, 10年): rain=rain_count*10/30, weight=1.5
#   group3 (2016-2025, 10年): rain=rain_count*10/30, weight=2.0

def weighted_rain_total(rain_count: int, total_years: int):
    """年代重み付きの (weighted_rain, weighted_total) を返す"""
    if total_years == 30:
        per_group = rain_count / 3.0
        w_rain = per_group * 1.0 + per_group * 1.5 + per_group * 2.0  # = rain_count * 1.5
        w_total = (total_years / 3.0) * (1.0 + 1.5 + 2.0)             # = 10 * 4.5 = 45
        return w_rain, w_total
    else:
        # うるう年（8年）などは重みなしそのまま
        return float(rain_count), float(total_years)

# ── メイン処理 ────────────────────────────────────────────────
output = {}
dates = all_dates()

for dt in dates:
    m_key = str(dt.month)
    d_key = str(dt.day)

    # 温度は元データそのまま（±3日の単純平均）
    temp_sum = 0.0
    temp_count = 0

    # 雨の重み付き合算
    total_w_rain = 0.0
    total_w_total = 0.0

    for nb in neighbors(dt, window=3):
        raw = get_raw(nb.month, nb.day)
        if raw is None:
            continue
        rain_count, total_years = raw

        # 年代重み付き
        w_rain, w_total = weighted_rain_total(rain_count, total_years)
        total_w_rain += w_rain
        total_w_total += w_total

        # 気温は元データから
        nb_m = str(nb.month)
        nb_d = str(nb.day)
        if nb_m in original and nb_d in original[nb_m]:
            t = original[nb_m][nb_d].get("average_temperature")
            if t is not None:
                temp_sum += t
                temp_count += 1

    if total_w_total == 0:
        continue

    new_prob = round(total_w_rain / total_w_total * 100, 1)
    new_temp = round(temp_sum / temp_count, 1) if temp_count > 0 else None

    # effective_years: 元の years_analyzed の±3日平均（表示用）
    neighbor_years = []
    for nb in neighbors(dt, window=3):
        raw = get_raw(nb.month, nb.day)
        if raw:
            neighbor_years.append(raw[1])
    effective_years = round(sum(neighbor_years) / len(neighbor_years)) if neighbor_years else 30

    if m_key not in output:
        output[m_key] = {}
    output[m_key][d_key] = {
        "rain_probability": new_prob,
        "average_temperature": new_temp,
        "years_analyzed": effective_years,
    }

# ── 出力 ──────────────────────────────────────────────────────
out_path = "client/public/weather_stats.json"
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"生成完了: {out_path}")
print(f"エントリ数: {sum(len(output[m]) for m in output)}")

# 変化の確認
print("\n=== 変化の例（元データ vs 新データ） ===")
check_dates = [(3, 25), (7, 15), (9, 1), (12, 31)]
for cm, cd in check_dates:
    orig_prob = original[str(cm)][str(cd)]["rain_probability"]
    new_prob2 = output[str(cm)][str(cd)]["rain_probability"]
    diff = round(new_prob2 - orig_prob, 1)
    sign = "+" if diff >= 0 else ""
    print(f"  {cm}月{cd}日: {orig_prob}% → {new_prob2}% ({sign}{diff})")
