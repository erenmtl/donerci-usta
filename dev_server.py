"""
Dönerci Usta - Sıfır Bağımlılıklı TypeScript Geliştirme Sunucusu (dev_server.py)
Node.js / Vite kurulu olmayan ortamlarda bile doğrudan Python 3 ile .ts dosyalarını
anında tarayıcı uyumlu ES2022 JavaScript modüllerine dönüştürerek http://localhost:5173
adresinde sunar.
"""

import http.server
import os
import re
import socketserver
import urllib.parse

PORT = 5173
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))


def strip_typescript(ts_code: str) -> str:
    """
    Projede kullanılan TypeScript tip bildirimlerini (interface, type, import type,
    as Cast, erişim belirteçleri ve tip anotasyonlarını) temizleyerek saf ES2022 JS üretir.
    """
    code = ts_code

    # 1. import type { ... } from '...'; satırlarını kaldır
    code = re.sub(r'^\s*import\s+type\s+\{[^}]*\}\s+from\s+[\'"][^\'"]+[\'"];?\s*$', '', code, flags=re.MULTILINE)
    # Karma import içindeki ", type Foo" ifadelerini kaldır
    code = re.sub(r',\s*type\s+[A-Za-z0-9_]+', '', code)

    # 2. export type Foo = ...; tek satırlık tip tanımlarını kaldır
    code = re.sub(r'^\s*(?:export\s+)?type\s+[A-Za-z0-9_]+\s*=[^;]+;\s*$', '', code, flags=re.MULTILINE)

    # 3. export interface Foo { ... } bloklarını dengeli süslü parantezle kaldır
    out = []
    i = 0
    n = len(code)
    iface_pattern = re.compile(r'^\s*(?:export\s+)?interface\s+[A-Za-z0-9_]+\s*\{', re.MULTILINE)
    while i < n:
        m = iface_pattern.search(code, i)
        if not m:
            out.append(code[i:])
            break
        out.append(code[i:m.start()])
        brace_idx = m.end() - 1
        depth = 0
        j = brace_idx
        while j < n:
            if code[j] == '{':
                depth += 1
            elif code[j] == '}':
                depth -= 1
                if depth == 0:
                    j += 1
                    break
            j += 1
        i = j
    code = ''.join(out)

    # 4. Sınıf üye erişim belirteçlerini (public, private, protected, readonly) kaldır
    code = re.sub(r'^(\s*)(?:public|private|protected)\s+(static\s+)?', r'\1\2', code, flags=re.MULTILINE)

    # 5. Sınıf özellik bildirimlerindeki `prop!: Type;` veya `prop: Type;` (değersiz) satırlarını kaldır
    code = re.sub(r'^\s*[A-Za-z0-9_]+!\s*:[^;=]+;\s*$', '', code, flags=re.MULTILINE)
    code = re.sub(r'^\s*[A-Za-z0-9_]+\?\s*:[^;=]+;\s*$', '', code, flags=re.MULTILINE)

    # 6. `as const` ve `as Type` ifadelerini kaldır
    code = re.sub(r'\s+as\s+const\b', '', code)
    code = re.sub(r'\s+as\s+any\b', '', code)
    code = re.sub(r'\s+as\s+HTMLElement\b', '', code)
    code = re.sub(r'\s+as\s+HTMLInputElement\b', '', code)
    code = re.sub(r'\s+as\s+HTMLSelectElement\b', '', code)
    code = re.sub(r'\s+as\s+HTMLCanvasElement\b', '', code)
    code = re.sub(r'\s+as\s+TabId\b', '', code)
    code = re.sub(r'\s+as\s+Gender\b', '', code)
    code = re.sub(r'\s+as\s+FamilyStatus\b', '', code)
    code = re.sub(r'\s+as\s+DifficultyLevel\b', '', code)
    code = re.sub(r'\s+as\s+0\s*\|\s*1\s*\|\s*2\s*\|\s*4', '', code)
    code = re.sub(r'\s+as\s+\[string,\s*\'ucuz\'\s*\|\s*\'standart\'\s*\|\s*\'kaliteli\'\]', '', code)

    # 7. Fonksiyon dönüş tiplerini `): ReturnType {` veya `): void =>` temizle
    code = re.sub(r'\)\s*:\s*(?:void|boolean|number|string|GridCoord\s*\|\s*null|GameState\s*\|\s*null|GameState|SaveSlotMeta\[\]|CustomerType| {[^}]+}|\[[^\]]+\]|Record<[^>]+>|\(\)\s*=>\s*void)\s*(\{|=>)', r') \1', code)

    # 8. Değişken ve özellik tip anotasyonlarını (`const x: Type =`, `prop: Type =`) temizle
    code = re.sub(
        r'(\b(?:const|let|var)\s+[A-Za-z0-9_]+)\s*:\s*[^=;\n]+\s*=',
        r'\1 =',
        code
    )
    # Sınıf özelliği `prop: Type = val;`
    code = re.sub(
        r'^(\s*[A-Za-z0-9_]+)\s*:\s*(?:Record<[^>]+>|Array<[^>]+>|[A-Za-z0-9_|\[\]\'"\s]+)\s*=',
        r'\1 =',
        code,
        flags=re.MULTILINE
    )
    # Değersiz sınıf özelliği `private canvas: HTMLCanvasElement;`
    code = re.sub(
        r'^(\s*[A-Za-z0-9_]+)\s*:\s*(?:HTMLCanvasElement|CanvasRenderingContext2D|GameEngine|HTMLElement)\s*;\s*$',
        r'\1;',
        code,
        flags=re.MULTILINE
    )

    # 9. Fonksiyon parametre tiplerini temizle
    # Örn: (config: { ... }) -> (config)
    code = re.sub(r'\(config:\s*\{[^}]+\}\)', '(config)', code)
    code = re.sub(r'\(candidate:\s*Omit<[^>]+>\)', '(candidate)', code)
    code = re.sub(r'\(slices:\s*Array<\{[^}]+\}>\)', '(slices)', code)
    code = re.sub(r'\(ctx:\s*CanvasRenderingContext2D,\s*m:\s*ReturnType<typeof\s+this\.getGridMetrics>\)', '(ctx, m)', code)
    code = re.sub(r'onCellClick\?:\s*\(gx:\s*number,\s*gy:\s*number\)\s*=>\s*void', 'onCellClick', code)
    code = re.sub(r'onSelectNpc\?:\s*\(npcId:\s*string\)\s*=>\s*void', 'onSelectNpc', code)
    code = re.sub(r'onComplete:\s*\(\)\s*=>\s*void', 'onComplete', code)
    code = re.sub(r'tierOverride\?:\s*\'ucuz\'\s*\|\s*\'standart\'\s*\|\s*\'kaliteli\'', 'tierOverride', code)
    code = re.sub(r'tier:\s*\'ucuz\'\s*\|\s*\'standart\'\s*\|\s*\'kaliteli\'', 'tier', code)
    code = re.sub(r'type:\s*\'info\'\s*\|\s*\'success\'\s*\|\s*\'warning\'\s*\|\s*\'danger\'\s*=\s*\'info\'', "type = 'info'", code)
    code = re.sub(r'speed:\s*0\s*\|\s*1\s*\|\s*2\s*\|\s*4', 'speed', code)

    # Genel basit parametre tipleri: `param: Type` -> `param`
    simple_types = (
        r'(?:string|number|boolean|any|GameState|GameEngine|HTMLElement|HTMLCanvasElement|'
        r'CanvasRenderingContext2D|MouseEvent|CustomerType|DailyLedgerEntry\[\]|DailyLedgerEntry|'
        r'GameEventDef|Listener)'
    )
    code = re.sub(rf'(\b[A-Za-z0-9_]+)\?\s*:\s*{simple_types}', r'\1', code)
    code = re.sub(rf'(\b[A-Za-z0-9_]+)\s*:\s*{simple_types}', r'\1', code)

    return code


class TypeScriptHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT_DIR, **kwargs)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        rel_path = parsed.path.lstrip('/')
        if not rel_path:
            rel_path = 'index.html'

        fs_path = os.path.join(ROOT_DIR, rel_path.replace('/', os.sep))

        if fs_path.endswith('.ts') and os.path.isfile(fs_path):
            with open(fs_path, 'r', encoding='utf-8') as f:
                ts_src = f.read()
            js_out = strip_typescript(ts_src)
            payload = js_out.encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/javascript; charset=utf-8')
            self.send_header('Content-Length', str(len(payload)))
            self.send_header('Cache-Control', 'no-store')
            self.end_headers()
            self.wfile.write(payload)
            return

        return super().do_GET()

    def log_message(self, format, *args):
        pass


if __name__ == '__main__':
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(('', PORT), TypeScriptHandler) as httpd:
        print(f"Donerci Usta Gelistirme Sunucusu calisiyor: http://localhost:{PORT}")
        httpd.serve_forever()
