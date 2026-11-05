import re, json, sys, pathlib
src = pathlib.Path(sys.argv[1]); out = {}
for f in sorted(src.glob('*.svg')):
    t = f.read_text()
    t = re.sub(r'<metadata>.*?</metadata>', '', t, flags=re.S)
    vb = [float(x) for x in re.search(r'viewBox="([^"]+)"', t).group(1).split()]
    def grp(gid):
        m = re.search(r'<g id="%s"[^>]*>(.*?)</g>' % gid, t, re.S)
        return re.findall(r'd="([^"]+)"', m.group(1)) if m else []
    sil, det = grp('silhouette'), grp('detail')
    for d in sil + det:
        assert re.fullmatch(r'[MLCZ0-9.,\s\-]+', d), d
    out[f.stem] = {'viewBox': vb, 'silhouette': sil, 'detail': det}
print('export const SILHOUETTES = ' + json.dumps(out) + ';')
