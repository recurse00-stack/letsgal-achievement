"""Generate offline manual and versioned AI reference copies from their source files."""
import hashlib,html,json,re,shutil
from pathlib import Path
root=Path(__file__).resolve().parents[1]
def inline(value):
    value=html.escape(value)
    return re.sub(r'`([^`]+)`',r'<code>\1</code>',value)
lines=(root/'docs/USER-GUIDE.md').read_text(encoding='utf-8').splitlines()
parts=[]; table=False; ordered=False
for line in lines+['']:
    if not line.startswith('|') and table: parts.append('</tbody></table></div>');table=False
    if not re.match(r'^\d+\. ',line) and ordered: parts.append('</ol>');ordered=False
    if not line.strip(): continue
    if line.startswith('|'):
        cells=[c.strip() for c in line.strip('|').split('|')]
        if all(re.fullmatch(r'[-: ]+',c) for c in cells): continue
        if not table:
            parts.append('<div class="table"><table><thead><tr>'+''.join('<th>'+inline(c)+'</th>' for c in cells)+'</tr></thead><tbody>');table=True
        else: parts.append('<tr>'+''.join('<td>'+inline(c)+'</td>' for c in cells)+'</tr>')
    elif re.fullmatch(r'!\[([^\]]*)\]\((images/[A-Za-z0-9_.-]+)\)',line):
        caption,image_path=re.fullmatch(r'!\[([^\]]*)\]\((images/[A-Za-z0-9_.-]+)\)',line).groups()
        parts.append('<figure><img style="max-width:100%;height:auto" src="'+html.escape(image_path,quote=True)+'" alt="'+html.escape(caption,quote=True)+'"></figure>')
    elif line.startswith('#'):
        level=len(line)-len(line.lstrip('#'));parts.append(f'<h{level}>'+inline(line[level:].strip())+f'</h{level}>')
    elif re.match(r'^\d+\. ',line):
        if not ordered: parts.append('<ol>');ordered=True
        parts.append('<li>'+inline(re.sub(r'^\d+\. ','',line))+'</li>')
    else: parts.append('<p>'+inline(line)+'</p>')
page='''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>局内成就系统使用说明</title><style>
body{font:17px/1.8 system-ui,"Microsoft YaHei",sans-serif;color:#23323c;background:#f6f7f9;margin:0}main{max-width:1000px;margin:auto;padding:40px 28px 80px;background:white}h1,h2{line-height:1.35;color:#183b4b}h2{margin-top:2em}code{background:#edf2f4;border-radius:4px;padding:2px 5px;overflow-wrap:anywhere}.table{overflow-x:auto}table{border-collapse:collapse;width:100%;font-size:15px}th,td{border:1px solid #d7e0e4;padding:10px 14px;text-align:left;vertical-align:top}th{background:#eef4f6}li{margin:8px 0}@media print{body{background:white}main{padding:0;font-size:12pt}h2{break-after:avoid}tr{break-inside:avoid}}</style><main>'''+ '\n'.join(parts)+'</main></html>\n'
(root/'docs/USER-GUIDE.html').write_text(page,encoding='utf-8')
refs=root/'ai/references';refs.mkdir(parents=True,exist_ok=True)
manifest=[]
for source in ['docs/CONTRACT.md']:
    path=root/source;target=refs/path.name;shutil.copyfile(path,target)
    manifest.append({'source':source,'reference':'references/'+path.name,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
(root/'ai/reference-manifest.json').write_text(json.dumps({'derived':True,'files':manifest},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'manual':'docs/USER-GUIDE.html','references':len(manifest)}))
