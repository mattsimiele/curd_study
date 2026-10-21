"""Regenerate the browser data module from the reviewed profile table."""
import json
from pathlib import Path
root = Path(__file__).resolve().parents[1]
keys = 'id name family milk origin rind texture signature make nuance source'.split()
rows = []
for line in (root / 'scripts/cheese-profiles.psv').read_text().splitlines():
    if not line or line.startswith('#'):
        continue
    fields = line.split('|')
    assert len(fields) == len(keys), line
    rows.append(dict(zip(keys, fields)))
assert len({r['id'] for r in rows}) == len(rows)
(root / 'dist/cheese-data.js').write_text('export const cheeses = ' + json.dumps(rows, ensure_ascii=False, indent=2) + ';\n')
