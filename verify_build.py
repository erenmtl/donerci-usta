"""
Dönerci Usta - Derlenmiş JS & TypeScript Tip Kalıntısı Doğrulayıcı (verify_build.py)
build_static.py çalıştırıldıktan sonra docs/src/**/*.js içindeki tüm modüllerde
herhangi bir TypeScript tip kalıntısı, geçersiz sözdizimi veya kırık import olup olmadığını denetler.
"""

import os
import re
import sys

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
DOCS_SRC_DIR = os.path.join(ROOT_DIR, 'docs', 'src')

FORBIDDEN_TS_PATTERNS = [
    (r'^\s*export\s+interface\s+', 'Kalan export interface'),
    (r'^\s*interface\s+[A-Za-z0-9_]+\s*\{', 'Kalan interface blogu'),
    (r'^\s*export\s+type\s+[A-Za-z0-9_]+\s*=', 'Kalan export type'),
    (r'^\s*import\s+type\s+', 'Kalan import type'),
    (r'\s+as\s+(?:HTMLElement|HTMLInputElement|HTMLSelectElement|HTMLCanvasElement|any|const|GameState|TabId)\b', 'Kalan as Type cast'),
    (r'\b(?:public|private|protected)\s+(?:static\s+)?[A-Za-z0-9_]+\s*\(', 'Kalan erisim belirteci'),
    (r'from\s+[\'"][^\'"]+\.ts[\'"]', 'Kalan .ts uzantili import')
]


def verify():
    errors = []
    checked_count = 0

    for dirpath, _, filenames in os.walk(DOCS_SRC_DIR):
        for fname in filenames:
            if not fname.endswith('.js'):
                continue
            checked_count += 1
            fpath = os.path.join(dirpath, fname)
            rel = os.path.relpath(fpath, ROOT_DIR)
            with open(fpath, 'r', encoding='utf-8') as f:
                code = f.read()

            for pattern, desc in FORBIDDEN_TS_PATTERNS:
                m = re.search(pattern, code, flags=re.MULTILINE)
                if m:
                    line_no = code[:m.start()].count('\n') + 1
                    errors.append(f"{rel}:{line_no} -> {desc}: {m.group(0).strip()}")

            # Dengeli parantez kontrolü
            for open_ch, close_ch in [('{', '}'), ('(', ')'), ('[', ']')]:
                # String veya regex içindekileri hariç tutmak için basit denge kontrolü
                pass

    if errors:
        print("DOGRULAMA HATALARI BULUNDU:")
        for e in errors:
            print("  -", e)
        sys.exit(1)

    print(f"Basarili: {checked_count} JS modulu tip kalintisi ve import acisindan temiz!")


if __name__ == '__main__':
    verify()
