"""Preview the installation target; add --apply to install the achievement AI guide."""
import argparse,json,os
from pathlib import Path
from install_plugin_skill import install

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--skills-root',default=str(Path(os.environ.get('CODEX_HOME',str(Path.home()/'.codex')))/'skills'))
    parser.add_argument('--user-root',default=str(Path.home()))
    parser.add_argument('--apply',action='store_true')
    args=parser.parse_args();root=Path(__file__).resolve().parents[1]
    meta=json.loads((root/'artifact.json').read_text(encoding='utf-8'))
    try:
        result=install(root/'ai',meta['extensionId'],meta['version'],args.skills_root,args.user_root,args.apply)
        print(json.dumps(result,ensure_ascii=False));return 0
    except Exception as exc:
        print(json.dumps({'status':'STOPPED','reason':str(exc)},ensure_ascii=False));return 1
if __name__=='__main__':raise SystemExit(main())
