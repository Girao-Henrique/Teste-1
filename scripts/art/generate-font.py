#!/usr/bin/env python3
"""Paradise — fonte pixel original. Grade desenhada aqui, sem fonte-base.

Requer fonttools e brotli. Execute da raiz: python3 scripts/art/generate-font.py
O compressor pode estar em .cache/font-tools (instalação local ao projeto).
"""
from pathlib import Path
import sys
import unicodedata

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / '.cache/font-tools'))
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen

# Linhas de pixels autorais. X é o contorno preenchido, ponto é transparência.
UPPER = {
 'A': ['..XX..','.X..X.','X....X','X....X','XXXXXX','X....X','X....X','X....X','X....X'],
 'B': ['XXXXX.','X....X','X....X','X....X','XXXXX.','X....X','X....X','X....X','XXXXX.'],
 'C': ['.XXXX.','X....X','X.....','X.....','X.....','X.....','X.....','X....X','.XXXX.'],
 'D': ['XXXX..','X...X.','X....X','X....X','X....X','X....X','X....X','X...X.','XXXX..'],
 'E': ['XXXXXX','X.....','X.....','X.....','XXXXX.','X.....','X.....','X.....','XXXXXX'],
 'F': ['XXXXXX','X.....','X.....','X.....','XXXXX.','X.....','X.....','X.....','X.....'],
 'G': ['.XXXX.','X....X','X.....','X.....','X..XXX','X....X','X....X','X....X','.XXXX.'],
 'H': ['X....X','X....X','X....X','X....X','XXXXXX','X....X','X....X','X....X','X....X'],
 'I': ['XXX','.X.','.X.','.X.','.X.','.X.','.X.','.X.','XXX'],
 'J': ['...XXX','.....X','.....X','.....X','.....X','.....X','X....X','X....X','.XXXX.'],
 'K': ['X....X','X...X.','X..X..','X.X...','XX....','X.X...','X..X..','X...X.','X....X'],
 'L': ['X.....','X.....','X.....','X.....','X.....','X.....','X.....','X.....','XXXXXX'],
 'M': ['X.....X','XX...XX','X.X.X.X','X..X..X','X.....X','X.....X','X.....X','X.....X','X.....X'],
 'N': ['X....X','XX...X','XX...X','X.X..X','X..X.X','X...XX','X...XX','X....X','X....X'],
 'O': ['.XXXX.','X....X','X....X','X....X','X....X','X....X','X....X','X....X','.XXXX.'],
 'P': ['XXXXX.','X....X','X....X','X....X','XXXXX.','X.....','X.....','X.....','X.....'],
 'Q': ['.XXXX.','X....X','X....X','X....X','X....X','X....X','X..X.X','X...X.','.XXX.X'],
 'R': ['XXXXX.','X....X','X....X','X....X','XXXXX.','X..X..','X...X.','X....X','X....X'],
 'S': ['.XXXX.','X....X','X.....','X.....','.XXXX.','.....X','.....X','X....X','.XXXX.'],
 'T': ['XXXXXXX','...X...','...X...','...X...','...X...','...X...','...X...','...X...','...X...'],
 'U': ['X....X','X....X','X....X','X....X','X....X','X....X','X....X','X....X','.XXXX.'],
 'V': ['X.....X','X.....X','X.....X','X.....X','X.....X','.X...X.','.X...X.','..X.X..','...X...'],
 'W': ['X.....X','X.....X','X.....X','X.....X','X..X..X','X..X..X','X..X..X','X.X.X.X','.X...X.'],
 'X': ['X....X','X....X','.X..X.','..XX..','..XX..','..XX..','.X..X.','X....X','X....X'],
 'Y': ['X.....X','X.....X','.X...X.','..X.X..','...X...','...X...','...X...','...X...','...X...'],
 'Z': ['XXXXXX','.....X','....X.','...X..','..X...','.X....','X.....','X.....','XXXXXX'],
}
LOWER = {
 'a':['.....','.XXX.','....X','.XXXX','X...X','X...X','.XXXX'],
 'b':['X....','X....','X....','XXXX.','X...X','X...X','X...X','X...X','XXXX.'],
 'c':['.....','.XXX.','X...X','X....','X....','X...X','.XXX.'],
 'd':['....X','....X','....X','.XXXX','X...X','X...X','X...X','X...X','.XXXX'],
 'e':['.....','.XXX.','X...X','XXXXX','X....','X...X','.XXX.'],
 'f':['..XX.','.X..X','.X...','XXXX.','.X...','.X...','.X...','.X...','.X...'],
 'g':['.....','.XXXX','X...X','X...X','X...X','.XXXX','....X','X...X','.XXX.'],
 'h':['X....','X....','X....','XXXX.','X...X','X...X','X...X','X...X','X...X'],
 'i':['X','.','X','X','X','X','X'],
 'j':['..X','...','..X','..X','..X','..X','..X','X.X','.X.'],
 'k':['X....','X....','X...X','X..X.','X.X..','XX...','X.X..','X..X.','X...X'],
 'l':['XX','.X','.X','.X','.X','.X','.X','.X','.X'],
 'm':['.......','XX.XXX.','X.X.X.X','X.X.X.X','X.X.X.X','X.X.X.X','X.X.X.X'],
 'n':['.....','XXXX.','X...X','X...X','X...X','X...X','X...X'],
 'o':['.....','.XXX.','X...X','X...X','X...X','X...X','.XXX.'],
 'p':['.....','XXXX.','X...X','X...X','X...X','XXXX.','X....','X....','X....'],
 'q':['.....','.XXXX','X...X','X...X','X...X','.XXXX','....X','....X','....X'],
 'r':['....','X.XX','XX..','X...','X...','X...','X...'],
 's':['.....','.XXXX','X....','.XXX.','....X','....X','XXXX.'],
 't':['.X..','.X..','XXXX','.X..','.X..','.X..','.X..','.X.X','..X.'],
 'u':['.....','X...X','X...X','X...X','X...X','X...X','.XXXX'],
 'v':['.....','X...X','X...X','X...X','.X.X.','.X.X.','..X..'],
 'w':['.......','X.....X','X.....X','X..X..X','X..X..X','X.X.X.X','.X...X.'],
 'x':['.....','X...X','.X.X.','..X..','..X..','.X.X.','X...X'],
 'y':['.....','X...X','X...X','X...X','X...X','.XXXX','....X','X...X','.XXX.'],
 'z':['.....','XXXXX','...X.','..X..','.X...','X....','XXXXX'],
}
DIGITS = {
 '0':['.XXX.','X...X','X..XX','X..XX','X.X.X','XX..X','XX..X','X...X','.XXX.'],
 '1':['..X.','.XX.','X.X.','..X.','..X.','..X.','..X.','..X.','XXXX'],
 '2':['.XXX.','X...X','....X','....X','...X.','..X..','.X...','X....','XXXXX'],
 '3':['XXXX.','....X','....X','....X','.XXX.','....X','....X','....X','XXXX.'],
 '4':['...X.','..XX.','.X.X.','X..X.','X..X.','XXXXX','...X.','...X.','...X.'],
 '5':['XXXXX','X....','X....','X....','XXXX.','....X','....X','X...X','.XXX.'],
 '6':['.XXX.','X....','X....','X....','XXXX.','X...X','X...X','X...X','.XXX.'],
 '7':['XXXXX','....X','....X','...X.','...X.','..X..','..X..','.X...','.X...'],
 '8':['.XXX.','X...X','X...X','X...X','.XXX.','X...X','X...X','X...X','.XXX.'],
 '9':['.XXX.','X...X','X...X','X...X','.XXXX','....X','....X','....X','.XXX.'],
}
EXTRA = {
 '.':['.','.','.','.','.','X','X'], ',':['..','..','..','..','..','.X','.X','X.'],
 ':':['.','.','X','X','.','X','X'], ';':['..','..','.X','.X','..','.X','.X','X.'],
 '!':['X','X','X','X','X','X','.','X','X'], '?':['.XXX.','X...X','....X','...X.','..X..','..X..','.....','..X..','..X..'],
 '-':['.....','.....','.....','XXXXX','.....','.....','.....'],
 '+':['.....','.....','..X..','XXXXX','..X..','.....','.....'],
 '=':['.....','.....','XXXXX','.....','XXXXX','.....','.....'],
 '/':['....X','....X','...X.','...X.','..X..','.X...','.X...','X....','X....'],
 '\\':['X....','X....','.X...','.X...','..X..','...X.','...X.','....X','....X'],
 '(':['..X','.X.','X..','X..','X..','X..','X..','.X.','..X'], ')':['X..','.X.','..X','..X','..X','..X','..X','.X.','X..'],
 '[':['XXX','X..','X..','X..','X..','X..','X..','X..','XXX'], ']':['XXX','..X','..X','..X','..X','..X','..X','..X','XXX'],
 '{':['..XX','.X..','.X..','.X..','X...','.X..','.X..','.X..','..XX'], '}':['XX..','..X.','..X.','..X.','...X','..X.','..X.','..X.','XX..'],
 '<':['.....','....X','..XX.','XX...','..XX.','....X','.....'], '>':['.....','X....','.XX..','...XX','.XX..','X....','.....'],
 '"':['X.X','X.X','X.X','...','...','...','...','...','...'], "'":['X','X','X','.','.','.','.','.','.'],
 '#':['.X.X.','.X.X.','XXXXX','.X.X.','.X.X.','XXXXX','.X.X.','.X.X.','.....'],
 '%':['XX..X','XX..X','...X.','...X.','..X..','.X...','.X...','X..XX','X..XX'],
 '&':['.XX...','X..X..','X..X..','.XX...','X.X..X','X..XX.','X...X.','X..X.X','.XX..X'],
 '*':['.....','X.X.X','.XXX.','XXXXX','.XXX.','X.X.X','.....'],
 '@':['.XXXXX.','X.....X','X.XXX.X','X.X.X.X','X.X.X.X','X.XXXX.','X......','.XXXXX.','.......'],
 '_':['.....','.....','.....','.....','.....','.....','XXXXX'],
 '|':['X','X','X','X','X','X','X','X','X'], '$':['..X..','.XXXX','X.X..','X.X..','.XXX.','..X.X','..X.X','XXXX.','..X..'],
 '°':['.XX.','X..X','X..X','.XX.','....','....','....','....','....'],
 '·':['.','.','.','X','.','.','.'],
 '…':['........','........','........','........','........','X..X..X.','X..X..X.'],
 '×':['.....','.....','X...X','.X.X.','..X..','.X.X.','X...X'],
 '→':['.......','...X...','....X..','XXXXXXX','....X..','...X...','.......'],
 '←':['.......','...X...','..X....','XXXXXXX','..X....','...X...','.......'],
 '↑':['.......','...X...','..XXX..','.X.X.X.','...X...','...X...','...X...'],
 '↓':['...X...','...X...','...X...','.X.X.X.','..XXX..','...X...','.......'],
 '✓':['.......','......X','.....X.','X...X..','.X.X...','..X....','.......'],
 '◆':['...X...','..XXX..','.XXXXX.','XXXXXXX','.XXXXX.','..XXX..','...X...'],
 '◇':['...X...','..X.X..','.X...X.','X.....X','.X...X.','..X.X..','...X...'],
 '★':['...X...','...X...','..XXX..','XXXXXXX','..XXX..','.X...X.','X.....X'],
 '☀':['...X...','.X...X.','..XXX..','X.XXX.X','..XXX..','.X...X.','...X...'],
 '☾':['...XX..','..X....','.X.....','.X.....','.X...X.','..XXX..','.......'],
 '❋':['...X...','.X.X.X.','..XXX..','XXXXXXX','..XXX..','.X.X.X.','...X...'],
 '♥':['.XX.XX.','XXXXXXX','XXXXXXX','.XXXXX.','..XXX..','...X...','.......'],
}
CELL = 80
glyphs, metrics, cmap = {}, {}, {}

def make_glyph(rows, baseline=0, accents=()):
    pen = TTGlyphPen(None)
    points = [(x, len(rows)-y-1+baseline) for y,row in enumerate(rows) for x,pixel in enumerate(row) if pixel=='X']
    width = max(map(len, rows), default=3)
    for mark in accents:
        center=(width-1)//2
        top= len(rows)+baseline+1
        if mark=='\u0301': points += [(center+1,top+1),(center,top)]
        elif mark=='\u0300': points += [(center-1,top+1),(center,top)]
        elif mark=='\u0302': points += [(center,top+1),(center-1,top),(center+1,top)]
        elif mark=='\u0303': points += [(center-1,top),(center,top+1),(center+1,top+1),(center+2,top)]
        elif mark=='\u0308': points += [(center-1,top),(center+1,top)]
        elif mark=='\u0327': points += [(center,-1),(center+1,-2),(center,-3),(center-1,-3)]
        elif mark=='\u030a': points += [(center,top+2),(center-1,top+1),(center+1,top+1),(center,top)]
    # Um contorno por pixel; sem fonte importada ou transformação de glifos prontos.
    for x,y in points:
        px=40+x*CELL; py=y*CELL
        pen.moveTo((px,py)); pen.lineTo((px,py+CELL)); pen.lineTo((px+CELL,py+CELL)); pen.lineTo((px+CELL,py)); pen.closePath()
    return pen.glyph(), ((width+1)*CELL,40)

shapes={**UPPER,**LOWER,**DIGITS,**EXTRA}
glyphs['.notdef'], metrics['.notdef']=make_glyph(['XXXXX','X...X','X.X.X','X...X','X.X.X','X...X','XXXXX'])
for code in list(range(32,384))+[ord(c) for c in EXTRA]+[0x2013,0x2014,0x2018,0x2019,0x201c,0x201d,0xa0]:
    char=chr(code)
    if code in cmap: continue
    if char in (' ','\u00a0'):
        pen=TTGlyphPen(None); glyph=pen.glyph(); metric=(320,0)
    else:
        alias={'–':'-','—':'-','‘':"'",'’':"'",'“':'"','”':'"','ı':'i','Ł':'L','ł':'l','ß':'B'}
        char=alias.get(char,char)
        decomp=unicodedata.normalize('NFD',char)
        base=decomp[0]
        if base not in shapes: continue
        # Descendentes estão dois pixels abaixo da linha de base; corpo tem sete.
        baseline=-2 if base in 'gjpqy' else 0
        glyph,metric=make_glyph(shapes[base],baseline,list(decomp[1:]))
    name=f'uni{code:04X}'; cmap[code]=name; glyphs[name]=glyph; metrics[name]=metric

fb=FontBuilder(896,isTTF=True)
fb.setupGlyphOrder(list(glyphs)); fb.setupCharacterMap(cmap); fb.setupGlyf(glyphs)
fb.setupHorizontalMetrics(metrics); fb.setupHorizontalHeader(ascent=1024,descent=-256,lineGap=80)
fb.setupNameTable({'familyName':'Paradise','styleName':'Regular','uniqueFontIdentifier':'Paradise-Original-2026-1.0','fullName':'Paradise Original Pixel','psName':'Paradise-Original-Pixel','version':'Version 1.0','copyright':'Arte original do Projeto Paradise? — 2026.'})
fb.setupOS2(sTypoAscender=1024,sTypoDescender=-256,sTypoLineGap=80,usWinAscent=1120,usWinDescent=320,sxHeight=560,sCapHeight=720,usWeightClass=400)
fb.setupPost(); fb.setupMaxp()
out=ROOT/'assets/interface'; out.mkdir(parents=True,exist_ok=True)
fb.font.flavor='woff2'; fb.save(str(out/'paradise.woff2'))
print(f'Fonte Paradise original: {len(cmap)} glifos, {(out/"paradise.woff2").stat().st_size} bytes.')

# Assinatura visual feita dos mesmos pixels, com desenho próprio do portal.
def rect(x,y,w,h,color): return f'<path fill="{color}" d="M{x} {y}h{w}v{h}h-{w}z"/>'
brand=[]
brand.append('<svg xmlns="http://www.w3.org/2000/svg" width="340" height="96" viewBox="0 0 340 96" shape-rendering="crispEdges"><title>Paradise?</title>')
brand.append('<path fill="#254f55" d="M7 70V34h4V25h4V19h8V15h14v4h8v6h4v9h4v36z"/>')
brand.append('<path fill="#efc579" d="M11 68V34h4V25h8V21h14v4h8v9h4v34h-6V35h-4V29h-6v-3H27v3h-6v6h-4v33z"/>')
brand.append('<path fill="#fff1cb" d="M11 34h4v34h-4zM15 25h8v4h-8zM23 21h14v4H23z"/>')
brand.append('<path fill="#b88361" d="M43 35h6v33h-6zM37 25h8v4h-8z"/>')
brand.append('<path fill="#fff4d4" d="M29 32h2v10h3v3h10v2H34v3h-3v10h-2V50h-3v-3H16v-2h10v-3h3z"/>')
brand.append('<path fill="#82c8a3" d="M3 59h4v4h4v4h5v3h7v3H11v-4H7v-4H3zM57 59h-4v4h-4v4h-5v3h-7v3h12v-4h4v-4h4z"/>')
brand.append('<path fill="#d1e5bd" d="M3 54h3v5H3zM1 48h3v4H1zM55 54h3v5h-3zM57 48h3v4h-3z"/>')
x=66
for char in 'PARADISE?':
    rows=shapes[char]
    # Borda recortada em pixels, nunca stroke suave ou glifo de outra fonte.
    points=[(x+xx*4,31+yy*4) for yy,row in enumerate(rows) for xx,pix in enumerate(row) if pix=='X']
    for px,py in points: brand.append(rect(px-1,py-1,6,7,'#253c4b'))
    for px,py in points: brand.append(rect(px,py+3,4,4,'#a47655'))
    for px,py in points: brand.append(rect(px,py,4,4,'#fff0cc' if py<43 else '#efc579' if py<55 else '#d8a26c'))
    x+=(max(map(len,rows))+2)*4
brand.append('<path fill="#73aa96" d="M68 80h245v1H68zM78 81v-4h4v-3h6v3h-4v4zM299 81v-4h-4v-3h-6v3h4v4z"/>')
brand.append('<path fill="#efd399" d="M183 78h3v-3h3v3h3v3h-3v3h-3v-3h-3z"/>')
brand.append('</svg>')
(out/'wordmark.svg').write_text(''.join(brand))
favicon='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges"><path fill="#253c4b" d="M4 0h24v4h4v24h-4v4H4v-4H0V4h4z"/><path fill="#438e7d" d="M5 3h22v2h2v22h-2v2H5v-2H3V5h2z"/><path fill="#eac079" d="M7 26V12h2V8h3V6h8v2h3v4h2v14h-3V13h-2V10h-8v3h-2v13z"/><path fill="#fff1cd" d="M15 11h2v5h5v2h-5v5h-2v-5h-5v-2h5z"/><path fill="#9bd3af" d="M4 21h3v3h4v2H6v-2H4zM28 21h-3v3h-4v2h5v-2h2z"/></svg>'
(out/'favicon.svg').write_text(favicon)
print('Assinatura Paradise? e favicon originais exportados.')
