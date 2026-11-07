"""Append new computer-voice clips to voice piece 0 only (s1-s4 are never rewritten, so phones don't re-download them).
Usage: python3 tts/pack_append.py OUT_DIR   (OUT_DIR from gen.py: N.mp3 files plus texts.json)
Then bump VOICE_V in app.js to the printed version, and CACHE in sw.js."""
import json, os, re, sys
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); V = R + '/voice'; OUT = sys.argv[1]
texts = json.load(open(OUT + '/texts.json'))
first_alt = lambda s: re.split(r'\s*[/·]\s*', re.sub(r'\s*\([^)]*\)', '', s))[0].strip()   # same as firstAlt() in app.js
vkey = lambda s: ' '.join(re.sub(r"[.,!?¿¡\"“”…:;]", ' ', re.sub(r"[’‘`]", "'", first_alt(s).lower())).split())   # same as vkey() in app.js
ix = json.load(open(V + '/index.json')); k = ix['k']; s0 = bytearray(open(V + '/s0.bin', 'rb').read())
for i, t in enumerate(texts):
    b = open('%s/%d.mp3' % (OUT, i), 'rb').read(); k[vkey(t)] = [0, len(s0), len(b)]; s0 += b
open(V + '/s0.bin', 'wb').write(s0)
ix['v'] += 1; ix['sv'] = [ix['v']] + ix['sv'][1:]
json.dump(ix, open(V + '/index.json', 'w'), separators=(',', ':'), ensure_ascii=False)
print(len(texts), 'clips appended; piece 0 now', round(len(s0) / 1e6, 2), 'MB; set VOICE_V =', ix['v'], '; versions', ix['sv'])
