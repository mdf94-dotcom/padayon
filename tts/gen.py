"""Record computer-voice clips with Meta's MMS Cebuano voice (facebook/mms-tts-ceb, CC BY-NC 4.0).
Same settings as the original run in the Cebuano App chat: seed 7, 16 kHz mono, peak 0.9, mp3 at 32 kb/s.
Usage: python3 tts/gen.py MODEL_DIR OUT_DIR "text one" "text two" ...   (MODEL_DIR holds config.json, vocab.json,
tokenizer_config.json, special_tokens_map.json and model.safetensors from huggingface.co/facebook/mms-tts-ceb)"""
import json, os, sys, subprocess, unicodedata, torch, numpy as np
from transformers import VitsModel, VitsTokenizer
M, OUT, texts = sys.argv[1], sys.argv[2], sys.argv[3:]
torch.manual_seed(7); os.makedirs(OUT, exist_ok=True)
tok = VitsTokenizer.from_pretrained(M); m = VitsModel.from_pretrained(M).eval()
def clean(t):  # accents off (lamî -> lami), brackets and other marks out: the voice only knows a-z, digits, space, ' and -
    t = unicodedata.normalize('NFD', t.lower()); t = ''.join(c for c in t if unicodedata.category(c) != 'Mn')
    t = __import__('re').sub(r'\([^)]*\)', ' ', t); return ' '.join(''.join(c if c in "abcdefghijklmnopqrstuvwxyz0123456789 '-" else ' ' for c in t).split())
for i, t in enumerate(texts):
    inp = tok(clean(t), return_tensors='pt')
    with torch.no_grad(): w = m(**inp).waveform[0].numpy()
    w = (np.clip(w / max(1e-6, np.abs(w).max()) * 0.9, -1, 1) * 32767).astype('<i2')
    f = os.path.join(OUT, '%d.mp3' % i)
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-f', 's16le', '-ar', '16000', '-ac', '1', '-i', '-', '-codec:a', 'libmp3lame', '-b:a', '32k', '-y', f], input=w.tobytes(), check=True)
    print(f, round(len(w) / 16000, 2), 's', t)
json.dump(texts, open(os.path.join(OUT, 'texts.json'), 'w'), ensure_ascii=False)
