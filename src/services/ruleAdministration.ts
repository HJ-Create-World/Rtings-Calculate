import { cloud } from './cloud';
import { authErrorMessage } from './auth';
import { csvToRecords } from '../utils/csv';

export const RINGS_PRODUCT_KEY = 'Product (general:product)';
export const METHODOLOGY_KEY = 'Test Methodology (general:test_bench)';

export interface DataSnapshot {
  id: string;
  versionLabel: string;
  fileName: string;
  rowCount: number;
  columnCount: number;
  productCount: number;
  methodology?: string | null;
  testBenchVersions?: string[];
  checksum?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface DataSnapshotInput {
  versionLabel: string;
  fileName: string;
  rowCount: number;
  columnCount: number;
  productCount: number;
  methodology?: string;
  testBenchVersions?: string[];
  checksum?: string;
}

export interface CsvSnapshot {
  columns: string[];
  rows: Array<Record<string, string>>;
}

export interface DataDiffSummary {
  baseVersionLabel: string;
  targetVersionLabel: string;
  baseRows: number;
  targetRows: number;
  baseColumns: number;
  targetColumns: number;
  addedColumns: number;
  removedColumns: number;
  addedProducts: number;
  removedProducts: number;
  changedCells: number;
  baseMethodology?: string | null;
  targetMethodology?: string | null;
}

export interface DataDiff {
  id: string;
  baseSnapshotId: string;
  targetSnapshotId: string;
  baseVersionLabel?: string;
  targetVersionLabel?: string;
  summary?: DataDiffSummary;
  createdAt?: string;
}

export interface DataDiffReport extends DataDiff {
  report: {
    summary: DataDiffSummary;
    addedColumns?: string[];
    removedColumns?: string[];
    addedProducts?: Array<{ product: string; value: Record<string, string> }>;
    removedProducts?: Array<{ product: string; value: Record<string, string> }>;
    columnChanges?: Array<{
      column: string;
      changedCount: number;
      changes: Array<{ product: string; old: string | null; new: string | null }>;
    }>;
  };
}

export interface RuleVersion {
  id: string;
  version: string;
  displayName: string;
  description?: string | null;
  status: 'draft' | 'active' | 'retired';
  metadata?: Record<string, unknown>;
  sourceSnapshotId?: string | null;
  basedOnVersionId?: string | null;
  nodeCount?: number;
  mappingCount?: number;
  createdAt?: string;
  activatedAt?: string | null;
  updatedAt?: string;
}

export interface RuleActivationLog {
  id: string;
  action: 'activate' | 'rollback';
  note?: string | null;
  createdAt?: string;
  versionId?: string;
  version?: string;
  previousVersion?: string | null;
  performedBy?: { name?: string; account?: string };
}

export interface DataSnapshotFull extends DataSnapshot {
  snapshot: CsvSnapshot;
}

export interface RuleReview {
  id: string;
  targetSnapshotId?: string | null;
  ruleVersionId?: string | null;
  objectType: 'column' | 'product' | 'mapping' | 'rule';
  itemId: string;
  title: string;
  recommendation: string;
  payload?: Record<string, unknown>;
  sourceType?: 'manual' | 'llm' | 'rule-import';
  model?: string | null;
  confidence?: number | null;
  evidence?: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected' | 'deferred';
  reviewNote?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

function unwrap<T>(result: { data: T | null; error: unknown }): T {
  if (result.error) throw result.error;
  if (result.data === null || result.data === undefined) {
    throw new Error('云数据库返回空结果');
  }
  return result.data;
}

async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  if (!globalThis.crypto?.subtle) return '';
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(digest)]
    .map(value => value.toString(16).padStart(2, '0'))
    .join('');
}

function mostCommonValue(values: string[]): string | undefined {
  const counter = new Map<string, number>();
  values.forEach(value => {
    const text = value?.trim();
    if (!text) return;
    counter.set(text, (counter.get(text) ?? 0) + 1);
  });
  return [...counter.entries()]
    .sort((left, right) => right[1] - left[1])[0]?.[0];
}

export async function readRtingsCsvSnapshot(file: File): Promise<{
  input: Omit<DataSnapshotInput, 'versionLabel'>;
  snapshot: CsvSnapshot;
  checksum: string;
}> {
  const buffer = await file.arrayBuffer();
  const text = new TextDecoder('utf-8').decode(buffer);
  const parsed = csvToRecords(text);
  const rows = parsed.rows.filter(row => row[RINGS_PRODUCT_KEY]?.trim());
  const methodology = mostCommonValue(rows.map(row => row[METHODOLOGY_KEY] ?? ''));
  const testBenchVersions = [...new Set(rows.map(row => row[METHODOLOGY_KEY] ?? '').filter(Boolean))];

  return {
    checksum: await sha256Hex(buffer),
    input: {
      fileName: file.name,
      rowCount: rows.length,
      columnCount: parsed.columns.length,
      productCount: new Set(rows.map(row => row[RINGS_PRODUCT_KEY])).size,
      methodology,
      testBenchVersions
    },
    snapshot: {
      columns: parsed.columns,
      rows
    }
  };
}

export async function uploadDataSnapshot(
  token: string,
  input: DataSnapshotInput & { snapshot: CsvSnapshot }
): Promise<DataSnapshot> {
  const result = unwrap(
    await cloud.database.rpc('app_create_data_snapshot', {
      p_token: token,
      p_version_label: input.versionLabel,
      p_file_name: input.fileName,
      p_row_count: input.rowCount,
      p_column_count: input.columnCount,
      p_product_count: input.productCount,
      p_methodology: input.methodology ?? null,
      p_test_bench_versions: input.testBenchVersions ?? [],
      p_checksum: input.checksum ?? null,
      p_snapshot: input.snapshot as unknown as Record<string, unknown>
    })
  );
  return result as DataSnapshot;
}

export async function listDataSnapshots(token: string): Promise<DataSnapshot[]> {
  const result = unwrap(
    await cloud.database.rpc('app_list_data_snapshots', { p_token: token })
  );
  return Array.isArray(result) ? (result as DataSnapshot[]) : [];
}

export async function generateDataDiff(
  token: string,
  baseSnapshotId: string,
  targetSnapshotId: string
): Promise<DataDiffReport> {
  const result = unwrap(
    await cloud.database.rpc('app_generate_data_diff', {
      p_token: token,
      p_base_snapshot_id: baseSnapshotId,
      p_target_snapshot_id: targetSnapshotId
    })
  );
  return result as DataDiffReport;
}

export async function listDataDiffs(token: string): Promise<DataDiff[]> {
  const result = unwrap(
    await cloud.database.rpc('app_list_data_diffs', { p_token: token })
  );
  return Array.isArray(result) ? (result as DataDiff[]) : [];
}

export async function getDataSnapshot(token: string, snapshotId: string): Promise<DataSnapshotFull> {
  const result = unwrap(
    await cloud.database.rpc('app_get_data_snapshot', {
      p_token: token,
      p_snapshot_id: snapshotId
    })
  );
  return result as DataSnapshotFull;
}

export async function getDataDiff(token: string, diffId: string): Promise<DataDiffReport> {
  const result = unwrap(
    await cloud.database.rpc('app_get_data_diff', {
      p_token: token,
      p_diff_id: diffId
    })
  );
  return result as DataDiffReport;
}

export async function createRuleVersion(
  token: string,
  input: {
    version: string;
    displayName: string;
    description?: string;
    rule: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    sourceSnapshotId?: string | null;
    basedOnVersionId?: string | null;
  }
): Promise<RuleVersion> {
  const result = unwrap(
    await cloud.database.rpc('app_create_rule_version', {
      p_token: token,
      p_version: input.version,
      p_display_name: input.displayName,
      p_description: input.description ?? null,
      p_rule: input.rule,
      p_metadata: input.metadata ?? {},
      p_source_snapshot_id: input.sourceSnapshotId ?? null,
      p_based_on_version_id: input.basedOnVersionId ?? null
    })
  );
  return result as RuleVersion;
}

export async function listRuleVersions(token: string): Promise<RuleVersion[]> {
  const result = unwrap(
    await cloud.database.rpc('app_list_rule_versions', { p_token: token })
  );
  return Array.isArray(result) ? (result as RuleVersion[]) : [];
}

export async function activateRuleVersion(
  token: string,
  versionId: string,
  action: 'activate' | 'rollback',
  note?: string
): Promise<RuleVersion> {
  const result = unwrap(
    await cloud.database.rpc('app_change_rule_version_status', {
      p_token: token,
      p_version_id: versionId,
      p_action: action,
      p_note: note ?? null
    })
  );
  return result as RuleVersion;
}

export async function listRuleActivationLogs(token: string): Promise<RuleActivationLog[]> {
  const result = unwrap(
    await cloud.database.rpc('app_list_rule_activation_logs', { p_token: token })
  );
  return Array.isArray(result) ? (result as RuleActivationLog[]) : [];
}

export async function listRuleReviews(
  token: string,
  targetSnapshotId?: string | null
): Promise<RuleReview[]> {
  const result = unwrap(
    await cloud.database.rpc('app_list_rule_reviews', {
      p_token: token,
      p_target_snapshot_id: targetSnapshotId ?? null
    })
  );
  return Array.isArray(result) ? (result as RuleReview[]) : [];
}

export async function createRuleReview(
  token: string,
  input: Omit<RuleReview, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'reviewNote'>
): Promise<RuleReview> {
  const result = unwrap(
    await cloud.database.rpc('app_create_rule_review', {
      p_token: token,
      p_target_snapshot_id: input.targetSnapshotId ?? null,
      p_rule_version_id: input.ruleVersionId ?? null,
      p_object_type: input.objectType,
      p_item_id: input.itemId,
      p_title: input.title,
      p_recommendation: input.recommendation,
      p_payload: input.payload ?? {},
      p_source_type: input.sourceType ?? 'manual',
      p_model: input.model ?? null,
      p_confidence: input.confidence ?? null,
      p_evidence: input.evidence ?? {}
    })
  );
  return result as RuleReview;
}

export async function updateRuleReview(
  token: string,
  reviewId: string,
  status: RuleReview['status'],
  reviewNote?: string
): Promise<RuleReview> {
  const result = unwrap(
    await cloud.database.rpc('app_update_rule_review', {
      p_token: token,
      p_review_id: reviewId,
      p_status: status,
      p_review_note: reviewNote ?? null
    })
  );
  return result as RuleReview;
}

export async function deleteRuleReview(token: string, reviewId: string): Promise<void> {
  await cloud.database.rpc('app_delete_rule_review', {
    p_token: token,
    p_review_id: reviewId
  });
}

export function ruleAdminErrorMessage(error: unknown, fallback: string): string {
  return authErrorMessage(error, fallback);
}
