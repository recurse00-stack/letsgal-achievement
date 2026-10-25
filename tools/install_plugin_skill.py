"""Portable Skill installation helper. Defaults to preview; never overwrites a conflict."""
from pathlib import Path
import argparse, hashlib, json, os, re, shutil, stat, uuid

def safe(path):
    p=Path(path).absolute()
    for item in [*reversed(p.parents),p]:
        if item.exists():
            s=item.lstat()
            if item.is_symlink() or getattr(s,'st_file_attributes',0)&0x400: raise ValueError('Linked path is not supported')
    return p
def identity(value):
    if not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9._-]{0,100}',value) or value.endswith('.') or value.upper().split('.')[0] in {'CON','PRN','AUX','NUL',*(f'COM{i}' for i in range(1,10)),*(f'LPT{i}' for i in range(1,10))}: raise ValueError('Unsafe ID/version/name')
    return value
def contents(root):
    result={}
    for folder,dirs,files in os.walk(root,followlinks=False):
        for name in dirs: safe(Path(folder)/name)
        for name in files:
            p=safe(Path(folder)/name)
            if not p.is_file(): raise ValueError('Non-file Skill content')
            result[p.relative_to(root).as_posix()]=hashlib.sha256(p.read_bytes()).hexdigest()
    return result
def install(source,plugin_id,version,skills_root,user_root,apply=False):
    source=safe(source); skills_root=safe(skills_root); user_root=safe(user_root)
    plugin_id=identity(plugin_id); version=identity(version)
    body=(source/'SKILL.md').read_text(encoding='utf-8-sig')
    match=re.search(r'^name:\s*(letsgal-plugin-[a-z0-9-]+)\s*$',body,re.M)
    if not match or not body.startswith('---'): raise ValueError('Expected letsgal-plugin-* Skill frontmatter')
    name=identity(match.group(1)); main=safe(skills_root/'letsgal-authoring/SKILL.md')
    has_main=main.is_file() and re.search(r'^name:\s*[\"\']?letsgal-authoring[\"\']?\s*$',main.read_text(encoding='utf-8-sig'),re.M)
    mode='under-main' if has_main else 'standalone'
    parent=user_root/'.letsgal-authoring/plugins' if has_main else skills_root
    target=safe(parent/plugin_id/version if has_main else parent/name)
    if not target.is_relative_to(safe(parent)): raise ValueError('Target escaped user area')
    if target==source or source.is_relative_to(target) or target.is_relative_to(source): raise ValueError('Source and destination overlap')
    desired=contents(source); existing=contents(target) if target.exists() else None
    if existing is not None and existing!=desired: raise ValueError('Existing Skill differs: preserve and compare it before an explicit upgrade; nothing overwritten')
    index=safe(parent/'INDEX.md'); old=index.read_bytes() if has_main and index.exists() else b''
    key=f'| {plugin_id} | {version} |'
    line=f'{key} [{name}]({plugin_id}/{version}/SKILL.md) | Installed files; Agent discovery not verified |\n'
    decoded=old.decode('utf-8-sig') if old else '# 插件 Skill 索引\n\n| ID | 版本 | 入口 | 验证 |\n|---|---|---|---|\n'
    new_index=(decoded.rstrip()+'\n'+line).encode('utf-8') if key not in decoded else old
    result={'mode':mode,'target':str(target),'status':'PREVIEW','main_skill_found':bool(has_main),'agent_discovery_verified':False}
    if not apply: return result
    parent.mkdir(parents=True,exist_ok=True)
    if existing is None:
        target.parent.mkdir(parents=True,exist_ok=True)
        staged=target.with_name(target.name+'.install-'+uuid.uuid4().hex)
        shutil.copytree(source,staged)
        if contents(staged)!=desired: raise ValueError('Staging verification failed; temporary copy retained')
        if target.exists(): raise ValueError('Destination changed during installation; staging retained')
        staged.rename(target)
    if has_main and new_index!=old:
        if (index.read_bytes() if index.exists() else b'')!=old: raise ValueError('Index changed; Skill copied, index not overwritten')
        if old:
            backup=parent/('INDEX.before-'+uuid.uuid4().hex+'.md'); backup.write_bytes(old)
        tmp=parent/('INDEX.'+uuid.uuid4().hex+'.tmp'); tmp.write_bytes(new_index); os.replace(tmp,index)
    result['status']='UNCHANGED' if existing==desired else 'INSTALLED'; return result
def main():
    p=argparse.ArgumentParser(description=__doc__)
    for arg in ['source','plugin-id','version','skills-root','user-root']: p.add_argument('--'+arg,required=True)
    p.add_argument('--apply',action='store_true'); a=p.parse_args()
    try: print(json.dumps(install(a.source,a.plugin_id,a.version,a.skills_root,a.user_root,a.apply),ensure_ascii=False)); return 0
    except Exception as ex: print(json.dumps({'status':'STOPPED','reason':str(ex)},ensure_ascii=False)); return 1
if __name__=='__main__': raise SystemExit(main())
