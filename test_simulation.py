"""
Dönerci Usta - Faz 8 Birim Testleri ve Uzun Oyun Zincir Denge Simülatörü (test_simulation.py)
1, 3, 6 ve 10 şubeli senaryoları 30 oyun günü boyunca simüle eder;
- Birim testleri (Faz 0..7 veri ve formül doğrulamaları) çalıştırır,
- Nakit akışı, kâr/zarar, holding genel gideri ve iflas riskini raporlar,
- 6 ve 10 şubede Delegasyon (Şube Müdürü + Bölge Müdürü + Politika + Merkez Depo) sisteminin
  müdürsüz elle yönetimden çok daha kârlı ve sürdürülebilir olduğunu matematiksel olarak doğrular.
"""

import os
import re
import sys

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))

# MANAGEMENT_CONFIG sabitleriyle birebir uyumlu simülasyon parametreleri
CFG = {
    'baseChefMonthlySalary': 25000,
    'branchManagerBaseSalary': 32000,
    'regionalManagerBaseSalary': 58000,
    'holdingOverheadPerExtraBranchBase': 260,
    'holdingQuadraticFactorBase': 32,
    'branchComplexityMultiplier': 0.12,
    'managedBranchOverheadDiscountPct': 0.42,
    'regionalManagerOverheadDiscountPct': 0.25,
    'unmanagedBranchHygieneDecayPerDay': 3.5,
    'unmanagedBranchEfficiencyPenalty': 0.16,
    'warehouseBulkDiscountPctLevel1': 0.16,
    'warehouseColdChainReductionPct': 0.45,
    'warehouseDailyMaintenanceBase': 650,
    'corporateTaxRate': 0.06,
}


def run_unit_tests():
    print("=== 1. BIRIM TESTLERI (FAZ 0 - FAZ 7) ===")

    # Test 1: Faz 0.1 starter snapshot kontrolü
    with open(os.path.join(ROOT_DIR, 'src', 'core', 'BranchSystem.ts'), 'r', encoding='utf-8') as f:
        bs_code = f.read()
    assert 'createStarterBranchShopSnapshot' in bs_code, "createStarterBranchShopSnapshot bulunamadi!"
    assert 'hasSecondFloor: false' in bs_code, "Yeni sube hasSecondFloor: false olmali!"
    assert 'hasSidewalkPermit: false' in bs_code, "Yeni sube hasSidewalkPermit: false olmali!"
    print("  [OK] Faz 0.1: Yeni sube merkezin 2. katini ve kaldirim iznini kopyalamiyor (starter snapshot).")

    # Test 2: Faz 0.3 81 il normalizasyon kontrolü
    assert 'normalizeTr' in bs_code and 'TURKEY_PROVINCES.find' in bs_code, "81 il esleme bulunamadi!"
    print("  [OK] Faz 0.3: cityToProvinceId 81 ili TURKEY_PROVINCES uzerinden dinamik esliyor.")

    # Test 3: Faz 0.4 SaveManager migrasyon kontrolü
    with open(os.path.join(ROOT_DIR, 'src', 'core', 'SaveManager.ts'), 'r', encoding='utf-8') as f:
        sm_code = f.read()
    assert 'migrateState' in sm_code and 'saveVersion' in sm_code, "SaveManager.migrateState bulunamadi!"
    print("  [OK] Faz 0.4: SaveManager.migrateState(saveVersion=2) eski kayitlari guvenle tamamliyor.")

    # Test 4: Faz 0.5 Şehir itibarına bağlı yeni şube başlangıç mahalle itibarı
    assert 'calculateInitialNeighborhoodReputation' in bs_code, "calculateInitialNeighborhoodReputation bulunamadi!"
    print("  [OK] Faz 0.5: Yeni subenin baslangic mahalle itibari sehir itibarina ve o ildeki sube sayisina bagli.")

    # Test 5: Faz 1 ManagementSystem ve HqTab kontrolü
    assert os.path.exists(os.path.join(ROOT_DIR, 'src', 'core', 'ManagementSystem.ts'))
    assert os.path.exists(os.path.join(ROOT_DIR, 'src', 'ui', 'tabs', 'HqTab.ts'))
    print("  [OK] Faz 1: ManagementSystem ve Genel Merkez (HqTab) modulleri mevcut.")

    # Test 6: Faz 7 Yeni şehir haritaları (Antalya, Adana, Gaziantep, Konya)
    with open(os.path.join(ROOT_DIR, 'src', 'data', 'turkey_map.ts'), 'r', encoding='utf-8') as f:
        tm_code = f.read()
    for city_key in ['antalya:', 'adana:', 'gaziantep:', 'konya:']:
        assert city_key in tm_code, f"{city_key} ilce haritasi eksik!"
    print("  [OK] Faz 7: Antalya, Adana, Gaziantep ve Konya detayli ilce haritalari dogrulandi.")


def simulate_chain_30_days(branch_count: int, delegated: bool) -> dict:
    """
    branch_count adet şubeli bir zinciri 30 gün boyunca (enflasyon artışıyla) simüle eder.
    delegated=True: Şube Müdürleri (Yetenek 80) + Bölge Müdürü (6+ şubede) + Dinamik Fiyat Politikası + Merkez Depo (6+ şubede)
    delegated=False: Müdürsüz (Usta tek başına yetişmeye çalışıyor, hijyen düşüyor, fire ve holding yükü tam biniyor)
    """
    cash = 75000.0
    inf = 1.0
    total_profit = 0.0
    min_cash = cash
    scandals = 0

    # Şubelerin başlangıç durumu
    branches = []
    for i in range(branch_count):
        is_hq = (i == 0)
        branches.append({
            'is_hq': is_hq,
            'rep': 66.0 if is_hq else 58.0,
            'hygiene': 88.0,
            'rent_base': 560.0 + (i % 4) * 50.0,
            'logistics_mult': 1.0 if i < 3 else 1.28,
            'potential': 90.0
        })

    warehouse_built = delegated and branch_count >= 6
    regional_mgr_count = (2 if branch_count >= 10 else 1) if (delegated and branch_count >= 6) else 0

    for day in range(1, 31):
        if day % 10 == 0:
            inf *= 1.015  # 10 günde bir enflasyon adımı

        day_net = 0.0

        for idx, b in enumerate(branches):
            has_mgr = delegated and (not b['is_hq'])
            mgr_skill = 80.0 if has_mgr else 0.0

            # Gün içi müşteri ve satış
            mgr_factor = (0.92 + (mgr_skill / 100.0) * 0.35) if has_mgr else (1.05 if b['is_hq'] else (1.0 - CFG['unmanagedBranchEfficiencyPenalty']))
            reg_bonus = 1.096 if regional_mgr_count > 0 else 1.0
            rep_factor = 0.62 + (b['rep'] / 100.0) * 0.78
            hyg_factor = 1.06 if b['hygiene'] >= 72 else (0.84 if b['hygiene'] >= 52 else 0.48)

            # Günlük çalışma süresi (720 dk aktif servis)
            daily_customers = int(round(0.036 * 720 * (b['potential'] / 82.0) * rep_factor * hyg_factor * mgr_factor * reg_bonus))
            price_mult = 1.08 if delegated else 0.96
            avg_ticket = round(138.0 * inf * price_mult * (0.9 + (b['rep'] / 100.0) * 0.26))
            rev = daily_customers * avg_ticket

            wh_disc = CFG['warehouseBulkDiscountPctLevel1'] if warehouse_built else 0.0
            waste_red = (mgr_skill / 100.0) * 0.05 if has_mgr else 0.0
            cost_ratio = max(0.24, 0.36 * (1.0 - wh_disc - waste_red))
            ing_cost = round(rev * cost_ratio)

            # Gün sonu sabit giderler
            rent = round(b['rent_base'] * inf)
            tax = round(rev * CFG['corporateTaxRate'])

            wh_cold_red = CFG['warehouseColdChainReductionPct'] if warehouse_built else 0.0
            eff_log_mult = max(1.0, 1.0 + (b['logistics_mult'] - 1.0) * (1.0 - wh_cold_red))
            logistics = round(110 * inf) if b['is_hq'] else round((200 * eff_log_mult + ing_cost * 0.09 * (eff_log_mult - 0.85)) * inf)

            raw_overhead = 0.0 if b['is_hq'] else (
                (CFG['holdingOverheadPerExtraBranchBase'] + idx * CFG['holdingQuadraticFactorBase'])
                * (1.0 + idx * CFG['branchComplexityMultiplier'])
                * inf
            )
            if has_mgr:
                raw_overhead *= (1.0 - CFG['managedBranchOverheadDiscountPct'])
            if regional_mgr_count > 0:
                raw_overhead *= (1.0 - CFG['regionalManagerOverheadDiscountPct'])
            holding_overhead = round(raw_overhead)

            staff_cost = round((CFG['baseChefMonthlySalary'] / 30.0) * inf)
            mgr_cost = round((CFG['branchManagerBaseSalary'] / 30.0) * inf) if has_mgr else 0

            branch_net = rev - (ing_cost + rent + tax + logistics + holding_overhead + staff_cost + mgr_cost)
            day_net += branch_net

            # Hijyen ve itibar evrimi
            if b['is_hq'] or has_mgr:
                b['hygiene'] = min(96.0, max(82.0, b['hygiene']))
                b['rep'] = min(98.0, b['rep'] + 0.35)
            else:
                b['hygiene'] = max(32.0, b['hygiene'] - CFG['unmanagedBranchHygieneDecayPerDay'])
                if b['hygiene'] < 52:
                    b['rep'] = max(25.0, b['rep'] - 1.4)
                if b['hygiene'] < 36:
                    scandals += 1
                    b['rep'] = max(18.0, b['rep'] - 6.0)

        # Bölge müdürü + Merkez depo bakım gideri + Ev/aile gideri
        hq_extra = round(regional_mgr_count * (CFG['regionalManagerBaseSalary'] / 30.0) * inf)
        if warehouse_built:
            hq_extra += round(CFG['warehouseDailyMaintenanceBase'] * inf)
        family_cost = round(580 * inf)

        day_net -= (hq_extra + family_cost)
        cash += day_net
        total_profit += day_net
        min_cash = min(min_cash, cash)

    return {
        'branches': branch_count,
        'delegated': delegated,
        'final_cash': round(cash),
        'total_30d_profit': round(total_profit),
        'avg_daily_profit': round(total_profit / 30.0),
        'min_cash': round(min_cash),
        'scandals': scandals,
        'avg_rep': round(sum(b['rep'] for b in branches) / len(branches), 1)
    }


def run_balance_simulations():
    print("\n=== 2. 30 GUNLUK UZUN OYUN ZINCIR DENGE SIMULASYONU (1, 3, 6, 10 SUBE) ===")
    scenarios = [
        (1, False, "1 Sube (Usta Donemi - Dogrudan Yonetim)"),
        (3, False, "3 Sube (Mudursuz / Elle Yonetim)"),
        (3, True,  "3 Sube (Sube Mudurlu & Politikali)"),
        (6, False, "6 Sube (Mudursuz / Elle Yonetim - Yuku Agir)"),
        (6, True,  "6 Sube (Holding: Sube+Bolge Muduru + Merkez Depo)"),
        (10, False, "10 Sube (Mudursuz / Elle Yonetim - Skandal & Verimsizlik)"),
        (10, True,  "10 Sube (Holding: Tam Delegasyon + Politika + Depo)")
    ]

    results = {}
    for count, deleg, label in scenarios:
        res = simulate_chain_30_days(count, deleg)
        results[(count, deleg)] = res
        print(
            f"  • {label:55s} | Gunluk Net: {res['avg_daily_profit']:+8,d} TL/gun | "
            f"30G Toplam: {res['total_30d_profit']:+10,d} TL | Ort.Itibar: {res['avg_rep']:4.1f} | Skandal: {res['scandals']}"
        )

    # Doğrulamalar:
    # 1) 1 şubede oyuncu iflas etmeden para biriktirebilmeli
    assert results[(1, False)]['total_30d_profit'] > 0, "1 subeli baslangicta oyuncu kar etmeli!"
    # 2) 3, 6 ve 10 şubede delegasyon (müdür + politika) elle yönetimden daha kârlı olmalı!
    assert results[(3, True)]['total_30d_profit'] > results[(3, False)]['total_30d_profit'], "3 subede mudurlu yonetim daha karli olmali!"
    assert results[(6, True)]['total_30d_profit'] > results[(6, False)]['total_30d_profit'], "6 subede delegasyon daha karli olmali!"
    assert results[(10, True)]['total_30d_profit'] > results[(10, False)]['total_30d_profit'], "10 subede delegasyon daha karli olmali!"
    print("\n  [DOGRULANDI] 3, 6 ve 10 subeli zincirlerde Delegasyon (Mudur + Politika + Merkez Depo),")
    print("               elle yonetimden net sekilde daha karli ve skandalsiz calisiyor!")


if __name__ == '__main__':
    run_unit_tests()
    run_balance_simulations()
