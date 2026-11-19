import { AchievementError, stageRecords, type StageRecord } from './model.ts';

export interface ProgressEnvelope {
  schemaVersion: 1;
  records: Array<{ achievementId: string; stageId: string }>;
}

export interface ProgressSave {
  get(key: 'stageProgress'): unknown;
  set(key: 'stageProgress', value: ProgressEnvelope[]): void;
}

function decodeRows(rows: unknown): StageRecord[] {
  if (!Array.isArray(rows)) throw new AchievementError('INVALID_DATA', '成就阶段记录必须为列表');
  return stageRecords(rows.map(row => ({ id: row?.achievementId, stageId: row?.stageId })));
}

function decodeSave(value: unknown): StageRecord[] | undefined {
  if (Array.isArray(value) && value.length === 0) return undefined;
  if (!Array.isArray(value) || value.length !== 1 || value[0]?.schemaVersion !== 1)
    throw new AchievementError('INVALID_DATA', '成就扩展存档结构或版本无法识别，已停止写入');
  return decodeRows(value[0].records);
}

export class StageProgress {
  private observed: string | undefined;

  constructor(private readonly save: ProgressSave, private readonly assertLive: () => void,
    private readonly restoring: () => boolean) {
    this.observed = JSON.stringify(save.get('stageProgress'));
  }

  changed(): boolean {
    const current = JSON.stringify(this.save.get('stageProgress'));
    if (current === this.observed) return false;
    this.observed = current;
    return true;
  }

  read(): StageRecord[] {
    this.assertLive();
    const current = decodeSave(this.save.get('stageProgress'));
    if (current !== undefined) return current;
    if (!this.restoring()) this.replace(undefined, []);
    return [];
  }

  replace(previous: StageRecord[] | undefined, records: StageRecord[]): void {
    this.assertLive();
    if (this.restoring()) throw new AchievementError('WRITE_CONFLICT', '读档恢复中，已停止写入成就阶段');
    const before = this.save.get('stageProgress');
    if (JSON.stringify(decodeSave(before)) !== JSON.stringify(previous))
      throw new AchievementError('WRITE_CONFLICT', '成就进度已变化，请重新操作');
    const valid = stageRecords(records);
    const value: ProgressEnvelope[] = [{ schemaVersion: 1, records: valid.map(({ id, stageId }) => ({ achievementId: id, stageId })) }];
    // The host can notify synchronously, including for our own write.
    this.observed = JSON.stringify(value);
    try {
      this.save.set('stageProgress', value);
      if (JSON.stringify(decodeSave(this.save.get('stageProgress'))) !== JSON.stringify(records))
        throw new AchievementError('WRITE_CONFLICT', '成就进度写入后读回不一致');
    } finally {
      this.observed = JSON.stringify(this.save.get('stageProgress'));
    }
  }
}
