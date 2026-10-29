"""Build the offline manual and task-scoped AI references from maintained Markdown."""
import hashlib,html,json,re
from pathlib import Path
root=Path(__file__).resolve().parents[1]
def inline(value):
    value=html.escape(value)
    value=re.sub(r'`([^`]+)`',r'<code>\1</code>',value)
    value=re.sub(r'\*\*([^*]+)\*\*',r'<strong>\1</strong>',value)
    return re.sub(r'\[([^\]]+)\]\((https://[^ )]+|[A-Za-z0-9_./#-]+)\)',r'<a href="\2">\1</a>',value)
lines=(root/'docs/USER-GUIDE.md').read_text(encoding='utf-8').splitlines()
parts=[]; table=False; ordered=False; unordered=False; sections=[]; section_open=False
for line in lines+['']:
    if not line.startswith('|') and table: parts.append('</tbody></table></div>');table=False
    if not re.match(r'^\d+\. ',line) and ordered: parts.append('</ol>');ordered=False
    if not line.startswith('- ') and unordered: parts.append('</ul>');unordered=False
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
        level=len(line)-len(line.lstrip('#'));title=line[level:].strip()
        if level==2:
            if section_open:parts.append('</section>')
            section_id='section-'+str(len(sections)+1);sections.append((section_id,title));section_open=True
            parts.append(f'<section id="{section_id}" class="topic"><h2>'+inline(title)+'</h2>')
        else:parts.append(f'<h{level}>'+inline(title)+f'</h{level}>')
    elif re.match(r'^\d+\. ',line):
        if not ordered: parts.append('<ol>');ordered=True
        parts.append('<li>'+inline(re.sub(r'^\d+\. ','',line))+'</li>')
    elif line.startswith('- '):
        if not unordered:parts.append('<ul>');unordered=True
        parts.append('<li>'+inline(line[2:])+'</li>')
    else: parts.append('<p>'+inline(line)+'</p>')
if section_open:parts.append('</section>')
toc=''.join(f'<a href="#{key}">{inline(title)}</a>' for key,title in sections)
page='''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>局内成就系统 · 离线使用手册</title><style>
:root{color-scheme:light}*{box-sizing:border-box}html{scroll-behavior:smooth}body{font:16px/1.8 system-ui,"Microsoft YaHei",sans-serif;color:#23323c;background:#f5f7f9;margin:0}a{color:#17687e;text-decoration:none}a:hover{text-decoration:underline}aside{position:fixed;inset:0 auto 0 0;width:280px;padding:28px 22px;overflow-y:auto;border-right:1px solid #d7e0e4;background:#eef3f5}aside strong{font-size:20px}aside small{display:block;color:#596b75}label{display:block;margin-top:20px;font-weight:600}input{width:100%;padding:10px;margin:6px 0;border:1px solid #a8bdc7;border-radius:6px;background:white;font:inherit}nav a{display:block;border-radius:5px;padding:6px 8px;font-size:14px}nav a:hover{background:#e0ebf0}main{max-width:1240px;margin-left:280px;padding:36px 46px 80px;background:white;min-height:100vh}h1,h2,h3{line-height:1.4;color:#183b4b}h1{font-size:30px}h2{padding-top:12px;border-top:1px solid #dde5e9;margin-top:2em;font-size:23px}.topic{scroll-margin-top:18px}code{background:#edf2f4;border-radius:4px;padding:2px 5px;overflow-wrap:anywhere}.table{overflow-x:auto}table{border-collapse:collapse;width:100%;font-size:14px}th,td{border:1px solid #d7e0e4;padding:10px 14px;text-align:left;vertical-align:top}th{background:#eef4f6}li{margin:8px 0}figure{margin:20px 0}figure img{border:1px solid #d7e0e4;border-radius:8px}#search-status{font-size:13px;min-height:24px;color:#526875}[hidden]{display:none!important}@media(max-width:850px){aside{position:relative;width:auto;padding:20px}nav{max-height:210px;overflow:auto}main{margin:0;padding:24px}h1{font-size:26px}}@media print{aside{display:none}body{background:white}main{margin:0;padding:0;font-size:12pt}.topic[hidden]{display:block!important}h2{break-after:avoid}tr,figure{break-inside:avoid}}
</style></head><body><aside><strong>局内成就系统</strong><small>离线使用手册 · 无需联网</small><label for="manual-search">查找内容</label><input id="manual-search" type="search" placeholder="例如：阶段、浮现、CSS" autocomplete="off"><div id="search-status" role="status" aria-live="polite"></div><nav aria-label="手册目录">'''+toc+'''</nav></aside><main id="content">'''+ '\n'.join(parts)+'''<p><a href="#content">返回顶部</a></p></main><script>
const input=document.getElementById('manual-search'),status=document.getElementById('search-status');
const topics=Array.from(document.querySelectorAll('.topic'));
input.addEventListener('input',()=>{const query=input.value.trim().toLocaleLowerCase();let found=0;topics.forEach(section=>{const match=!query||section.textContent.toLocaleLowerCase().includes(query);section.hidden=!match;document.querySelector('nav a[href="#'+section.id+'"]').hidden=!match;if(match)found++});status.textContent=query?(found?'找到 '+found+' 个相关章节':'没有找到，试试其他关键词'):'共 '+topics.length+' 个章节'});
status.textContent='共 '+topics.length+' 个章节';
</script></body></html>\n'''
(root/'docs/USER-GUIDE.html').write_text(page,encoding='utf-8')
refs=root/'ai/references';refs.mkdir(parents=True,exist_ok=True)
source='docs/CONTRACT.md'
path=root/source
contract=path.read_text(encoding='utf-8')
chunks=re.split(r'^## ',contract,flags=re.M)
introduction=chunks[0].split('\n',1)[1].strip()
sections={chunk.split('\n',1)[0].strip():'## '+chunk.strip() for chunk in chunks[1:]}
routes=[
    ('methods-and-state.md','方法调用与运行记录',['运行阶段记录','方法']),
    ('stage-configuration.md','成就、阶段与表现配置',['作者定义','阶段表现与界面分层']),
    ('page-and-notifications.md','成就页、浏览与通知',['玩家投影和通知','横向浏览适配']),
    ('appearance-and-css.md','卡片编排、外观与 CSS',['卡片编排与外观字段','元素 CSS']),
    ('compatibility.md','适用版本与验证范围',['验证范围']),
]
selected=[section for _,_,names in routes for section in names]
if len(sections)!=len(chunks)-1 or len(selected)!=len(set(selected)) or set(selected)!=set(sections):
    raise ValueError('Every unique contract section must have exactly one task reference')
manifest=[]
def reference(name,text,names):
    target=refs/name;target.write_text(text,encoding='utf-8')
    manifest.append({'source':source,'sections':names,'reference':'references/'+name,
                     'source_sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
                     'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
for name,title,names in routes:
    lead=introduction+'\n\n' if name=='compatibility.md' else ''
    reference(name,'# '+title+'\n\n'+lead+'\n\n'.join(sections[s] for s in names)+'\n',names)
index='# 接口资料索引\n\n按当前任务读取对应资料，无需从头通读。接口内容按主题从维护源 docs/CONTRACT.md 生成，旧全文入口在此保留导航。\n\n'
index+='\n'.join('- ['+title+']('+name+')' for name,title,_ in routes)
index+='\n- [资料安装与维护](maintenance.md)：仅安装、升级或维护 Skill 时读取。\n'
reference('CONTRACT.md',index,[])
(root/'ai/reference-manifest.json').write_text(json.dumps({'derived':True,'files':manifest},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'manual':'docs/USER-GUIDE.html','references':len(manifest)}))
