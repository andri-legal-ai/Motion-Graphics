# Builds plates/tr-fr.json: Andri's own French (tr-fr-dict.json, from the app bundle) overridden by my table (staging-snapshot/tr-fr-manual.json).
import json, pathlib
H = pathlib.Path(__file__).resolve().parent
d = json.loads((H / 'tr-fr-dict.json').read_text()); m = json.loads((H / '../staging-snapshot/tr-fr-manual.json').read_text())
out = {'exact': {**d['exact'], **m['exact']}, 'regex': m['regex'], 'prefix': m['prefix']}
(H / 'tr-fr.json').write_text(json.dumps(out, ensure_ascii=False, indent=0)); print(len(out['exact']), 'exact,', len(out['regex']), 'regex,', len(out['prefix']), 'prefix')
