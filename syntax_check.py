"""Dönüştürülmüş JS modüllerini gerçek bir JS ayrıştırıcıyla (esprima) sözdizimi açısından denetler.
esprima ES2017'dir: ?. ve ?? gibi yeni sözdizimlerini bilmez. Bu yüzden ayrıştırmadan önce
bunlar eşdeğer eski sözdizimine çevrilir; yalnızca TS tip artıklarını yakalamak amaçlanır."""
import glob
import os
import re
import sys

import esprima

ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ROOT)
from dev_server import strip_typescript  # noqa: E402


def downlevel(code: str) -> str:
    code = code.replace('?.[', '[').replace('?.(', '(').replace('?.', '.')
    code = re.sub(r'\?\?=', '||=', code)
    code = code.replace('??', '||')
    code = re.sub(r'\|\|=', '=', code)
    # ES2022 sınıf alanları (tek satırlık, sınıf üyesi girintisi) esprima'da yok -> kaldır
    code = re.sub(r'^ {2}(?:static\s+)?[A-Za-z_]\w*(?:\s*=\s*[^\n]*?)?;[ \t]*(?://[^\n]*)?$', '', code, flags=re.M)
    # isteğe bağlı catch bağlaması
    code = re.sub(r'catch\s*\{', 'catch (_e) {', code)
    return code


bad = 0
files = glob.glob(os.path.join(ROOT, 'src', '**', '*.ts'), recursive=True)
for f in sorted(files):
    code = downlevel(strip_typescript(open(f, encoding='utf-8').read()))
    try:
        esprima.parseModule(code)
    except Exception as e:  # noqa: BLE001
        bad += 1
        msg = str(e)
        m = re.search(r'Line (\d+)', msg)
        line = int(m.group(1)) if m else 0
        ctx = code.split('\n')[line - 1].strip()[:140] if line else ''
        print(f"HATA {os.path.relpath(f, ROOT)}: {msg}\n    -> {ctx}")

print(f"{len(files)} dosya tarandı, {bad} dosyada sözdizimi hatası.")
sys.exit(1 if bad else 0)
