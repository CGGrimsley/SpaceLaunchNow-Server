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
# Models built for the line-up in Blender from the line-up silhouettes.
ORIGINAL = {
    'lm2c': 'Long March 2C', 'lm2d': 'Long March 2D', 'lm3b': 'Long March 3B', 'lm4c': 'Long March 4C',
    'lm5b': 'Long March 5B', 'lm6a': 'Long March 6A', 'lm7': 'Long March 7', 'lm7a': 'Long March 7A',
    'lm8': 'Long March 8', 'lm12': 'Long March 12', 'zhuque2e': 'Zhuque-2E', 'ceres1': 'Ceres-1',
    'kinetica1': 'Kinetica-1', 'gravity1': 'Gravity-1', 'angaraa5': 'Angara A5', 'kuaizhou': 'Kuaizhou 1A',
    'h3': 'H3', 'soyuz': 'Soyuz 2.1b',
}
for key, title in ORIGINAL.items():
    out[key] = {'title': title, 'source': 'https://github.com/CGGrimsley', 'author': 'CGGrimsley',
                'authorUrl': 'https://github.com/CGGrimsley', 'license': 'made for Space Launch Now',
                'licenseUrl': 'https://github.com/CGGrimsley', 'original': True}
print('export const CREDITS = ' + json.dumps(out, indent=1) + ';')
