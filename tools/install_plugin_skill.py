"""Install plugin documentation with preview, explicit upgrades and verified recovery."""
from pathlib import Path
import argparse, hashlib, json, os, re, shutil, stat, uuid, zipfile

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
def install(source,plugin_id,version,skills_root,user_root,apply=False,upgrade=False,backup_dir=None):
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
    if target.exists() and not target.is_dir(): raise ValueError('Installation target is not a directory')
    if not target.is_relative_to(safe(parent)): raise ValueError('Target escaped user area')
    if target==source or source.is_relative_to(target) or target.is_relative_to(source): raise ValueError('Source and destination overlap')
    desired=contents(source); existing=contents(target) if target.exists() else None
    conflict=existing is not None and existing!=desired
    if conflict and not upgrade: raise ValueError('Existing documentation differs: use --upgrade after reviewing the target; nothing overwritten')
    if conflict and set(existing)-set(desired): raise ValueError('Destination contains extra files; preserve and review them separately before upgrading')
    index=safe(parent/'INDEX.md'); old=index.read_bytes() if has_main and index.exists() else b''
    key=f'| {plugin_id} | {version} |'
    revision=re.search(r'^\s+revision:\s*(\S+)',body,re.M)
    scope=('资料修订 '+revision.group(1)+'；') if revision else ''
    manual=f'；[离线手册]({plugin_id}/{version}/docs/USER-GUIDE.html)' if 'docs/USER-GUIDE.html' in desired else ''
    line=f'{key} [{name}]({plugin_id}/{version}/SKILL.md){manual} | {scope}文件安装已核对；实际宿主适配按资料范围 |'
    decoded=old.decode('utf-8-sig') if old else '# 插件 Skill 索引\n\n| ID | 版本 | 入口 | 验证 |\n|---|---|---|---|\n'
    lines=decoded.splitlines(); matches=[i for i,s in enumerate(lines) if s.startswith(key)]
    if matches:
        lines[matches[0]]=line
        for i in reversed(matches[1:]):del lines[i]
    else:
        table=next((i for i,s in enumerate(lines) if s.startswith('|') and re.fullmatch(r'[| :\-]+',s)),None)
        if table is None:
            lines+=['','| ID | 版本 | 入口 | 验证 |','|---|---|---|---|'];pos=len(lines)
        else:
            pos=table+1
            while pos<len(lines) and lines[pos].startswith('|'):pos+=1
        lines.insert(pos,line)
    new_index=('\n'.join(lines).rstrip()+'\n').encode('utf-8')
    backup_root=safe(backup_dir or user_root/'.letsgal-authoring/install-backups')
    if backup_root==target or backup_root.is_relative_to(target) or backup_root==source or backup_root.is_relative_to(source): raise ValueError('Recovery directory must be outside the source and destination')
    result={'mode':mode,'target':str(target),'status':'PREVIEW','main_skill_found':bool(has_main),'agent_discovery_verified':False,'upgrade_required':conflict,'files':len(desired),'manual':str(target/'docs/USER-GUIDE.html') if 'docs/USER-GUIDE.html' in desired else None}
    if not apply: return result
    if (contents(target) if target.exists() else None)!=existing or (index.read_bytes() if index.exists() else b'')!=old: raise ValueError('Installation target or index changed; retry after reviewing')
    if conflict or (has_main and old and new_index!=old):
        backup_root.mkdir(parents=True,exist_ok=True)
        archive=backup_root/(plugin_id+'-'+version+'-'+uuid.uuid4().hex+'.zip')
        records=[]
        with zipfile.ZipFile(archive,'x',zipfile.ZIP_DEFLATED) as z:
            for rel,digest in (existing or {}).items():
                z.write(target/rel,'installed/'+rel);records.append({'path':'installed/'+rel,'original':str(target/rel),'sha256':digest})
            if has_main and old:
                z.writestr('INDEX.md',old);records.append({'path':'INDEX.md','original':str(index),'sha256':hashlib.sha256(old).hexdigest()})
            items=[{'archive_member':r['path'],'original':r['original'],'before_sha256':r['sha256']} for r in records]
            z.writestr('manifest.json',json.dumps({'files':records,'items':items,'restore':'Extract into a new directory; compare each original before restoring. Do not overwrite newer data.'},ensure_ascii=False,indent=2))
        with zipfile.ZipFile(archive) as z:
            if any(hashlib.sha256(z.read(r['path'])).hexdigest()!=r['sha256'] for r in records): raise ValueError('Recovery verification failed')
        result['backup']=str(archive)
    parent.mkdir(parents=True,exist_ok=True)
    if existing is None or conflict:
        target.parent.mkdir(parents=True,exist_ok=True)
        staged=target.with_name(target.name+'.install-'+uuid.uuid4().hex)
        shutil.copytree(source,staged)
        if contents(staged)!=desired: raise ValueError('Staging verification failed; temporary copy retained')
        if (contents(target) if target.exists() else None)!=existing: raise ValueError('Destination changed during installation; staging retained')
        if conflict:
            retired=target.with_name(target.name+'.previous-'+uuid.uuid4().hex)
            assert retired.resolve().is_relative_to(safe(parent).resolve())
            target.rename(retired)
            try:staged.rename(target)
            except Exception:
                retired.rename(target);raise
            if contents(target)!=desired:raise ValueError('Installed content mismatch; previous directory retained')
            assert retired.resolve().is_relative_to(safe(parent).resolve()) and contents(retired)==existing
            shutil.rmtree(retired)
        else:staged.rename(target)
    if has_main and new_index!=old:
        if (index.read_bytes() if index.exists() else b'')!=old: raise ValueError('Index changed; Skill copied, index not overwritten')
        tmp=parent/('INDEX.'+uuid.uuid4().hex+'.tmp'); tmp.write_bytes(new_index); os.replace(tmp,index)
    result['status']='UNCHANGED' if existing==desired else ('UPDATED' if conflict else 'INSTALLED'); return result
def main():
    p=argparse.ArgumentParser(description=__doc__)
    for arg in ['source','plugin-id','version','skills-root','user-root']: p.add_argument('--'+arg,required=True)
    p.add_argument('--apply',action='store_true');p.add_argument('--upgrade',action='store_true');p.add_argument('--backup-dir'); a=p.parse_args()
    try: print(json.dumps(install(a.source,a.plugin_id,a.version,a.skills_root,a.user_root,a.apply,a.upgrade,a.backup_dir),ensure_ascii=False)); return 0
    except Exception as ex: print(json.dumps({'status':'STOPPED','reason':str(ex)},ensure_ascii=False)); return 1
if __name__=='__main__': raise SystemExit(main())
