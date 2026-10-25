import json,shutil,unittest,uuid
from pathlib import Path
from install_plugin_skill import install

class InstallerTests(unittest.TestCase):
 def setUp(self):
  self.base=Path(__file__).resolve().parents[1]/'.cache/installer-tests';self.base.mkdir(parents=True,exist_ok=True);self.root=self.base/uuid.uuid4().hex;self.root.mkdir();self.source=self.root/'source';self.source.mkdir();(self.source/'SKILL.md').write_text('---\nname: letsgal-plugin-achievement\ndescription: test fixture\n---\n',encoding='utf-8');self.skills=self.root/'skills';self.user=self.root/'user'
 def tearDown(self):
  assert self.root.resolve().is_relative_to(self.base.resolve()) and self.root.resolve()!=self.base.resolve()
  shutil.rmtree(self.root)
 def do(self,**kw):return install(self.source,kw.get('plugin','achievement-eded54'),kw.get('version','0.1.0'),self.skills,self.user,kw.get('apply',True))
 def main(self):
  q=self.skills/'letsgal-authoring';q.mkdir(parents=True);(q/'SKILL.md').write_text('---\nname: letsgal-authoring\n---',encoding='utf-8')
 def test_preview_no_write(self):
  r=self.do(apply=False);self.assertEqual(r['status'],'PREVIEW');self.assertFalse(self.skills.exists());self.assertFalse(self.user.exists())
 def test_standalone(self):self.assertEqual(self.do()['mode'],'standalone')
 def test_main_and_repeat(self):
  self.main();r=self.do();self.assertEqual(r['mode'],'under-main');self.assertEqual(self.do()['status'],'UNCHANGED');self.assertTrue((self.user/'.letsgal-authoring/plugins/INDEX.md').is_file())
 def test_conflict_preserves(self):
  r=self.do();old=(Path(r['target'])/'SKILL.md').read_bytes();(self.source/'extra.md').write_text('change');self.assertRaises(ValueError,self.do);self.assertEqual((Path(r['target'])/'SKILL.md').read_bytes(),old)
 def test_versions_preserved(self):
  self.main();r=self.do();self.do(version='0.2.0');self.assertTrue(Path(r['target']).is_dir())
 def test_traversal_rejected(self):
  for identity in ['../escape','CON','x/y','x.']:
   with self.subTest(identity=identity):self.assertRaises(ValueError,self.do,plugin=identity)
 def test_missing_source_refused(self):
  (self.source/'SKILL.md').unlink();self.assertRaises(FileNotFoundError,self.do)
if __name__=='__main__':unittest.main()
