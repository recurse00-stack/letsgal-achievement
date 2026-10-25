"""Stage an unpublished local candidate from an explicit public file allowlist."""
import argparse,hashlib,json,shutil,zipfile
from pathlib import Path

def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def main():
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--release-root',required=True);parser.add_argument('--source-snapshot',required=True);args=parser.parse_args()
 root=Path(__file__).resolve().parents[1];release=Path(args.release_root).resolve();meta=json.loads((root/'artifact.json').read_text(encoding='utf-8'));version=meta['version'];ext=meta['extensionId'];dest=release/'versions'/version
 if release==root or release.is_relative_to(root) or root.is_relative_to(release):raise ValueError('Source/release must be independent')
 manifest_path=dest/'release-manifest.json'
 if manifest_path.exists() and json.loads(manifest_path.read_text(encoding='utf-8')).get('status')=='published':raise ValueError('Published version cannot be overwritten')
 files=[root/x for x in ['artifact.json','README.md','docs/USER-GUIDE.md','docs/USER-GUIDE.html','docs/CONTRACT.md','tools/install-ai.py','tools/install_plugin_skill.py','tools/build-docs.py','tools/test-installer.py','tools/stage-candidate.py']]
 for folder in ['ai','docs/images',ext+'/src',ext+'/tests',ext+'/scripts',ext+'/ui',ext+'/assets',ext+'/dist']:
  files.extend(f for f in (root/folder).rglob('*') if f.is_file() and '__pycache__' not in f.parts)
 files += [root/ext/x for x in ['extension.json','package.json','package-lock.json','vite.config.ts','tsconfig.json']]
 for f in files:
  if f.is_symlink() or not f.is_file() or not f.resolve().is_relative_to(root):raise ValueError('Invalid public file '+str(f))
 allowed={f.relative_to(root).as_posix() for f in files};target=dest/'source'
 if target.exists():
  extra={f.relative_to(target).as_posix() for f in target.rglob('*') if f.is_file()}-allowed
  if extra:raise ValueError('Unexpected candidate files: '+str(sorted(extra)))
 for f in files:
  out=target/f.relative_to(root);out.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(f,out)
 package=dest/(ext+'-'+version+'.zip')
 package_files=[f for f in files if f.relative_to(root).parts[0]==ext and (f.relative_to(root).parts[1] in ['dist','ui','assets'] or f.name=='extension.json')]
 with zipfile.ZipFile(package,'w',zipfile.ZIP_DEFLATED) as z:
  for f in package_files:z.write(target/f.relative_to(root),f.relative_to(root/ext).as_posix())
 for channel in ['github','workshop']:
  q=dest/channel;q.mkdir(exist_ok=True);(q/'description.md').write_text('# 成就 0.1.0\n\n可配置等级、图标名称、激活状态、成就页和排队浮现。创作者可固定翻页、纵向滚动、横向滚动，也可分别勾选向玩家开放的方式；默认固定翻页、隐藏切换按钮。三种方式共用自由设计的可视化卡片模板。\n\n本地候选，适用 Studio 2.8.0-beta.1。状态模板采用 profile 跨存档保存，旧档读取和桌面 Player 冷重开已验证；暂未发布。当前定义保存于扩展设置，配置页自动写作者表、自定义属性组和 Wiki 尚未提供。列表容器高级 CSS 由模块管理，卡片内部样式保留。\n',encoding='utf-8')
 manifest={'schema':1,'type':'plugin','id':ext,'version':version,'revision':meta['revision'],'status':'local-candidate','source_snapshot':args.source_snapshot,'parts':{'body':{'status':'changed','path':package.name},'ai_skill':{'status':'changed','path':'source/ai/SKILL.md'},'installer':{'status':'verified-unchanged','path':'source/tools/install-ai.py'},'human_manual':{'status':'changed','path':'source/docs/USER-GUIDE.html'}},'engine_compatibility':{'beta':{'version':'2.8.0-beta.1','runtime':'Studio and desktop Player three browsing modes with custom cards passed'},'stable':{'version':'UNKNOWN','runtime':'unverified'},'selection':'project-and-host-evidence'},'verification':{'core_adapter_and_browse_tests':26,'installer_tests':{'count':7,'reused_from':'2026-10-24','reason':'installer unchanged'},'typescript':'passed','build':'dual-entry-passed','studio':'creator-subsets-three-modes-custom-two-row-template-passed','player':'browse.3-custom-card-pagination-horizontal-vertical-wheel-keyboard-passed','save_load':{'browse_mode':'browse.3-horizontal-shared-cold-restart-passed-2026-10-25','activation':'profile-old-slot-passed-2026-10-24-reused; existing-activation-retained-on-2026-10-25-restart'},'export':'public-export-unverified; local-desktop-playtest-built','ai_discovery':'unverified'},'channels':{'github':{'status':'not-published','description':'github/description.md','images':['source/docs/images/achievement-browse-options.png','source/docs/images/achievement-horizontal-cards.png']},'workshop':{'status':'not-published','description':'workshop/description.md','images':['source/docs/images/achievement-browse-pagination.png','source/docs/images/achievement-popup.jpg']}},'known_gaps':['Horizontal adapter targets Studio 2.8 native list DOM; revalidate on host upgrades. List container advanced CSS is module-managed; authored card CSS is retained.','Public editor author-table API unavailable: automatic author-table writes, custom attribute groups and Wiki integration are not implemented. Definitions remain in extension settings.','Custom pages use a top-level card data-list and selected mode button refIds; direct UI show does not bind browsing.','Existing session/archive bindings require explicit rebinding; no automatic migration.','Public release export, Web/Android and other host versions remain unverified.'],'files':[]}
 for f in sorted(dest.rglob('*')):
  if f.is_file() and f!=manifest_path:manifest['files'].append({'path':f.relative_to(dest).as_posix(),'bytes':f.stat().st_size,'sha256':digest(f)})
 manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 for row in manifest['files']:
  if digest(dest/row['path'])!=row['sha256']:raise RuntimeError('Readback mismatch')
 print(json.dumps({'status':'STAGED','version':version,'public_files':len(files),'manifest_files':len(manifest['files']),'package':str(package),'sha256':digest(package)},ensure_ascii=False))
if __name__=='__main__':main()
