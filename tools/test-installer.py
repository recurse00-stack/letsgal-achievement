import json,shutil,unittest,uuid,zipfile,hashlib
from pathlib import Path
from install_plugin_skill import install

class InstallerTests(unittest.TestCase):
 def setUp(self):
  self.base=Path(__file__).resolve().parents[1]/'.cache/installer-tests';self.base.mkdir(parents=True,exist_ok=True);self.root=self.base/uuid.uuid4().hex;self.root.mkdir();self.source=self.root/'source';self.source.mkdir();(self.source/'SKILL.md').write_text('---\nname: letsgal-plugin-achievement\ndescription: test fixture\n---\n',encoding='utf-8');self.skills=self.root/'skills';self.user=self.root/'user'
 def tearDown(self):
  assert self.root.resolve().is_relative_to(self.base.resolve()) and self.root.resolve()!=self.base.resolve()
  shutil.rmtree(self.root)
 def do(self,**kw):return install(self.source,kw.get('plugin','mixing-entropy.achievement'),kw.get('version','0.1.0'),self.skills,self.user,kw.get('apply',True),kw.get('upgrade',False),kw.get('backup_dir'))
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
 def test_explicit_upgrade_backup_and_repeat(self):
  self.main();r=self.do();target=Path(r['target']);before=(target/'SKILL.md').read_bytes()
  (self.source/'SKILL.md').write_bytes(before+b'\nUpdated\n');(self.source/'docs').mkdir();(self.source/'docs/USER-GUIDE.html').write_text('Offline manual')
  preview=self.do(apply=False,upgrade=True);self.assertTrue(preview['upgrade_required']);self.assertEqual((target/'SKILL.md').read_bytes(),before)
  changed=self.do(upgrade=True);self.assertEqual(changed['status'],'UPDATED');self.assertTrue((target/'docs/USER-GUIDE.html').exists())
  with zipfile.ZipFile(changed['backup']) as z:
   self.assertEqual(z.read('installed/SKILL.md'),before)
   for row in json.loads(z.read('manifest.json'))['files']:self.assertEqual(hashlib.sha256(z.read(row['path'])).hexdigest(),row['sha256'])
  self.assertEqual(self.do()['status'],'UNCHANGED');self.assertFalse(list(target.parent.glob('*.previous-*')))
 def test_upgrade_retains_unknown_files(self):
  r=self.do();target=Path(r['target']);(target/'personal.md').write_text('my note');old=(target/'SKILL.md').read_bytes()
  (self.source/'SKILL.md').write_bytes(old+b'\nnew');self.assertRaises(ValueError,self.do,upgrade=True)
  self.assertEqual((target/'personal.md').read_text(),'my note');self.assertEqual((target/'SKILL.md').read_bytes(),old)
 def test_index_row_stays_inside_table_and_preserves_notes(self):
  self.main();p=self.user/'.letsgal-authoring/plugins/INDEX.md';p.parent.mkdir(parents=True)
  p.write_text('# Index\n\n| ID | Version | Link | Scope |\n|---|---|---|---|\n| other | 1 | x | y |\n\nPersonal notes\n',encoding='utf-8')
  self.do();s=p.read_text(encoding='utf-8');self.assertLess(s.index('| mixing-entropy.achievement'),s.index('Personal notes'));self.assertIn('| other | 1 | x | y |',s)
  self.do();self.assertEqual(p.read_text(encoding='utf-8').count('| mixing-entropy.achievement'),1)
 def test_backup_inside_target_refused(self):
  r=self.do();target=Path(r['target']);old=(target/'SKILL.md').read_bytes();(self.source/'SKILL.md').write_bytes(old+b'changed')
  self.assertRaises(ValueError,self.do,upgrade=True,backup_dir=target/'backups');self.assertEqual((target/'SKILL.md').read_bytes(),old)
if __name__=='__main__':unittest.main()
