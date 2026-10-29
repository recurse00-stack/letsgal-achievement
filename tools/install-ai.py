"""Preview Skill and offline manual installation; --apply installs, --upgrade updates with recovery."""
import argparse,json,os,shutil,tempfile
from pathlib import Path
from install_plugin_skill import install

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--skills-root',default=str(Path(os.environ.get('CODEX_HOME',str(Path.home()/'.codex')))/'skills'))
    parser.add_argument('--user-root',default=str(Path.home()))
    parser.add_argument('--apply',action='store_true')
    parser.add_argument('--upgrade',action='store_true',help='Explicitly update differing installed documentation after creating a verified backup')
    parser.add_argument('--backup-dir',help='Recovery archive directory; defaults to the user documentation backup directory')
    args=parser.parse_args();root=Path(__file__).resolve().parents[1]
    meta=json.loads((root/'artifact.json').read_text(encoding='utf-8'))
    try:
        with tempfile.TemporaryDirectory(prefix='achievement-docs-') as work:
            payload=Path(work)/'payload';shutil.copytree(root/'ai',payload)
            docs=payload/'docs';docs.mkdir()
            for name in ['USER-GUIDE.md','USER-GUIDE.html']:shutil.copyfile(root/'docs'/name,docs/name)
            shutil.copytree(root/'docs/images',docs/'images')
            result=install(payload,meta['extensionId'],meta['version'],args.skills_root,args.user_root,args.apply,args.upgrade,args.backup_dir)
        print(json.dumps(result,ensure_ascii=False));return 0
    except Exception as exc:
        print(json.dumps({'status':'STOPPED','reason':str(exc)},ensure_ascii=False));return 1
if __name__=='__main__':raise SystemExit(main())
