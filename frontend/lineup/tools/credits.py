import re, json, sys, pathlib
out = {}
for d in sorted(pathlib.Path(sys.argv[1]).iterdir()):
    t = (d / 'license.txt').read_text()
    g = lambda k: re.search(r'\* %s:\t(.*)' % k, t).group(1).strip()
    a = re.match(r'(.*) \((.*)\)', g('author'))
    out[d.name] = {'title': g('title'), 'source': g('source'), 'author': a.group(1), 'authorUrl': a.group(2),
                   'license': 'CC BY 4.0', 'licenseUrl': 'https://creativecommons.org/licenses/by/4.0/'}
    assert 'CC-BY-4.0' in g('license type'), d
out['atlasv'] = {'title': 'Atlas V 551', 'source': 'https://science.nasa.gov/3d-resources/', 'author': 'NASA', 'authorUrl': 'https://science.nasa.gov/3d-resources/', 'license': 'NASA media guidelines', 'licenseUrl': 'https://www.nasa.gov/nasa-brand-center/images-and-media/'}
print('export const CREDITS = ' + json.dumps(out, indent=1) + ';')
