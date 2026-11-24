"""
Dönerci Usta - Statik Web Sitesi Derleyicisi (build_static.py)
Tüm TypeScript (.ts) kaynak dosyalarını saf tarayıcı uyumlu ES2022 JavaScript (.js)
modüllerine dönüştürerek GitHub Pages (/docs) altında doğrudan çalışacak statik siteyi üretir.
"""

import os
import re
import shutil
from dev_server import strip_typescript

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
DOCS_DIR = os.path.join(ROOT_DIR, 'docs')


def build():
    if os.path.exists(DOCS_DIR):
        shutil.rmtree(DOCS_DIR)
    os.makedirs(DOCS_DIR, exist_ok=True)

    # .nojekyll ekle (GitHub Pages'in _ veya özel dosyaları yoksaymaması için)
    with open(os.path.join(DOCS_DIR, '.nojekyll'), 'w', encoding='utf-8') as f:
        f.write('')

    # public/assets kopyala
    pub_assets = os.path.join(ROOT_DIR, 'public', 'assets')
    if os.path.exists(pub_assets):
        shutil.copytree(pub_assets, os.path.join(DOCS_DIR, 'assets'))

    # src/ altındaki tüm dosyaları dönüştürerek docs/src/ altına yaz
    src_root = os.path.join(ROOT_DIR, 'src')
    for dirpath, _, filenames in os.walk(src_root):
        rel_dir = os.path.relpath(dirpath, ROOT_DIR)
        target_dir = os.path.join(DOCS_DIR, rel_dir)
        os.makedirs(target_dir, exist_ok=True)

        for fname in filenames:
            src_file = os.path.join(dirpath, fname)
            if fname.endswith('.ts'):
                with open(src_file, 'r', encoding='utf-8') as f:
                    ts_code = f.read()
                js_code = strip_typescript(ts_code)
                # import '.../foo.ts' ifadelerini '.../foo.js' olarak güncelle
                js_code = re.sub(r'(from\s+[\'"][^\'"]+)\.ts([\'"])', r'\1.js\2', js_code)

                js_fname = fname[:-3] + '.js'
                target_file = os.path.join(target_dir, js_fname)
                with open(target_file, 'w', encoding='utf-8') as f:
                    f.write(js_code)
            else:
                shutil.copy2(src_file, os.path.join(target_dir, fname))

    # index.html dosyasını göreceli (relative) yollarla docs/index.html olarak oluştur
    with open(os.path.join(ROOT_DIR, 'index.html'), 'r', encoding='utf-8') as f:
        html = f.read()

    html = html.replace('href="/src/styles/main.css"', 'href="./src/styles/main.css"')
    html = html.replace('href="/src/styles/components.css"', 'href="./src/styles/components.css"')
    html = html.replace('src="/src/main.ts"', 'src="./src/main.js"')

    with open(os.path.join(DOCS_DIR, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(html)

    print("Statik web sitesi basariyla derlendi: docs/")


if __name__ == '__main__':
    build()
