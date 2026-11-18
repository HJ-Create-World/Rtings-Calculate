import { computed, ref } from 'vue';
import { rtingsRule } from '../data/rtingsRule';
import { cloud } from '../services/cloud';
import { useAuth } from './useAuth';
import type { ScoringRule } from '../core/types';
import { authErrorMessage } from '../services/auth';

export interface RuleRuntimeVersion {
  id: string;
  version: string;
  displayName: string;
  status?: string;
  rule: ScoringRule;
}

const currentRule = ref<ScoringRule>(rtingsRule);
const activeRuleVersionId = ref<string | null>(null);
const activeRuleVersionLabel = ref<string>(rtingsRule.version);
const ruleLoading = ref(false);
const ruleLoaded = ref(false);
const ruleError = ref('');
const versionCache = new Map<string, RuleRuntimeVersion>();

function unwrap<T>(result: { data: T | null; error: unknown }): T {
  if (result.error) throw result.error;
  if (result.data === null || result.data === undefined) {
    throw new Error('云数据库返回空结果');
  }
  return result.data;
}

function normalizeRule(value: unknown): ScoringRule {
  const rule = value as ScoringRule;
  if (!rule?.version || !rule.rootId || !Array.isArray(rule.nodes) || !Array.isArray(rule.mappings)) {
    throw new Error('规则版本数据结构无效');
  }
  return rule;
}

function normalizeVersion(value: unknown): RuleRuntimeVersion {
  const raw = value as Record<string, unknown>;
  const rule = normalizeRule(raw.rule);
  return {
    id: String(raw.id),
    version: String(raw.version ?? rule.version),
    displayName: String(raw.displayName ?? raw.version ?? ''),
    status: raw.status ? String(raw.status) : undefined,
    rule
  };
}

function setRuntimeVersion(version: RuleRuntimeVersion) {
  currentRule.value = version.rule;
  activeRuleVersionId.value = version.id;
  activeRuleVersionLabel.value = version.version;
  versionCache.set(version.version, version);
}

export async function fetchRuleVersion(token: string, ruleVersion: string): Promise<RuleRuntimeVersion> {
  const cached = versionCache.get(ruleVersion);
  if (cached) return cached;
  const result = unwrap(
    await cloud.database.rpc('app_get_rule_by_version', {
      p_token: token,
      p_rule_version: ruleVersion
    })
  );
  const version = normalizeVersion(result);
  versionCache.set(version.version, version);
  return version;
}

export async function fetchActiveRule(token: string): Promise<RuleRuntimeVersion> {
  const result = unwrap(
    await cloud.database.rpc('app_get_active_rule', { p_token: token })
  );
  const version = normalizeVersion(result);
  versionCache.set(version.version, version);
  return version;
}

export async function initializeRuleRuntime(force = false): Promise<void> {
  const { session, isLoggedIn } = useAuth();
  const token = session.value?.token;
  if (!force && ruleLoaded.value) return;
  if (!isLoggedIn.value || !token) {
    currentRule.value = rtingsRule;
    activeRuleVersionId.value = null;
    activeRuleVersionLabel.value = rtingsRule.version;
    ruleLoaded.value = false;
    return;
  }

  ruleLoading.value = true;
  ruleError.value = '';
  try {
    const version = await fetchActiveRule(token);
    setRuntimeVersion(version);
    ruleLoaded.value = true;
  } catch (error) {
    currentRule.value = rtingsRule;
    activeRuleVersionId.value = null;
    activeRuleVersionLabel.value = rtingsRule.version;
    ruleError.value = authErrorMessage(error, '加载激活规则版本失败，已回退本地规则');
  } finally {
    ruleLoading.value = false;
  }
}

export async function getRuleForVersion(ruleVersion: string): Promise<ScoringRule> {
  const { session } = useAuth();
  const token = session.value?.token;
  if (!token) return rtingsRule;
  if (ruleVersion === currentRule.value.version) return currentRule.value;
  const version = await fetchRuleVersion(token, ruleVersion);
  return version.rule;
}

export function useRuleRuntime() {
  const ruleVersionLabel = computed(() => activeRuleVersionLabel.value);
  return {
    currentRule,
    activeRuleVersionId,
    activeRuleVersionLabel,
    ruleVersionLabel,
    ruleLoading,
    ruleLoaded,
    ruleError,
    initializeRuleRuntime,
    getRuleForVersion,
    fetchRuleVersion,
    fetchActiveRule
  };
}
