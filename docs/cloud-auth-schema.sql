-- WorkBuddy Cloud PostgreSQL: BOE Rtings 账号与权限模型
-- 建表与函数已通过云端迁移执行；此文件作为可追溯的数据库契约快照。
-- 注意：单次迁移只执行一条 SQL；函数主体中的 $$...$$ 是单条语句的一部分。

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account text NOT NULL,
  employee_no text NOT NULL,
  name text NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin','engineer','user')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','banned')),
  permissions jsonb NOT NULL DEFAULT '{"data_view":true,"score_entry":true,"test_method":false}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.app_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS app_users_account_lower_key ON public.app_users (lower(account));
CREATE UNIQUE INDEX IF NOT EXISTS app_users_employee_no_key ON public.app_users (employee_no);
CREATE INDEX IF NOT EXISTS app_sessions_user_id_idx ON public.app_sessions (user_id, expires_at);

REVOKE ALL ON public.app_users FROM PUBLIC;
REVOKE ALL ON public.app_sessions FROM PUBLIC;

-- app_register(p_account, p_employee_no, p_name, p_password)
-- 注册用户。第一个账号为系统管理员；后续账号默认普通用户，test_method=false。
-- 返回 jsonb：{ token, expiresAt, user }。

-- app_login(p_account, p_password)
-- 校验 bcrypt 密码、检查封禁状态、撤销旧会话并创建 24 小时会话。
-- 返回 jsonb：{ token, expiresAt, user }。

-- app_session_user(p_token) RETURNS app_users
-- 内部辅助函数：通过 SHA-256 token hash 查找有效用户。

-- app_current_user(p_token) RETURNS jsonb
-- 返回当前登录用户；登录态过期抛错。

-- app_logout(p_token)
-- 撤销当前会话。

-- app_change_password(p_token, p_old_password, p_new_password)
-- 校验原密码并更新 bcrypt hash；新密码至少 8 位。

-- app_list_users(p_token) RETURNS SETOF jsonb
-- 仅系统管理员可用；返回用户列表，不返回密码 hash。

-- app_update_user(p_token, p_user_id, p_role, p_status, p_permissions, p_employee_no, p_name)
-- 仅系统管理员可用；更新角色、状态、模块权限、工号与姓名。
-- 不允许当前管理员封禁自己或降级自己。

-- app_system_stats(p_token) RETURNS jsonb
-- 仅系统管理员可用；返回用户、会话与评测运行状态。

-- app_list_evaluations(p_token, p_limit) RETURNS SETOF evaluations
-- 需 data_view 权限；按 updated_at 倒序返回评测，最多 500 条。

-- app_get_evaluation(p_token, p_client_id) RETURNS evaluations
-- 需 data_view 权限；按 client_id 查询单条评测。

-- app_upsert_evaluation(p_token, p_evaluation jsonb) RETURNS evaluations
-- 需 score_entry 权限；按 client_id upsert 评测。
-- p_evaluation 需包含 client_id/rule_version/inputs，可包含品牌、型号、测试信息与 expected_total。

-- 兼容历史云端评测表：未登录 WorkBuddy Auth 的自定义账号写入时使用应用默认 owner。
ALTER TABLE public.evaluations ALTER COLUMN owner_id SET DEFAULT 'app';

-- 关闭 evaluations 直连读写，所有云端评测访问改为上述 SECURITY DEFINER RPC。
REVOKE ALL ON public.evaluations FROM PUBLIC;
REVOKE ALL ON public.evaluations FROM anon;
REVOKE ALL ON public.evaluations FROM authenticated;

-- ===== Rtings 数据快照 / 差异报告 / 规则版本管理（第一阶段） =====

CREATE TABLE IF NOT EXISTS public.rtings_data_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_label text NOT NULL UNIQUE,
  file_name text NOT NULL,
  row_count integer NOT NULL,
  column_count integer NOT NULL,
  product_count integer NOT NULL DEFAULT 0,
  methodology text,
  test_bench_versions jsonb NOT NULL DEFAULT '[]'::jsonb,
  checksum text,
  snapshot jsonb NOT NULL,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rtings_data_diffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base_snapshot_id uuid NOT NULL REFERENCES public.rtings_data_snapshots(id) ON DELETE CASCADE,
  target_snapshot_id uuid NOT NULL REFERENCES public.rtings_data_snapshots(id) ON DELETE CASCADE,
  report jsonb NOT NULL,
  summary jsonb NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (base_snapshot_id,target_snapshot_id)
);

CREATE TABLE IF NOT EXISTS public.rule_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  source_snapshot_id uuid REFERENCES public.rtings_data_snapshots(id),
  based_on_version_id uuid REFERENCES public.rule_versions(id),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','retired')),
  rule jsonb NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  activated_at timestamptz,
  activated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rule_version_nodes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  version_id uuid NOT NULL REFERENCES public.rule_versions(id) ON DELETE CASCADE,
  node_id text NOT NULL,
  parent_id text,
  label text NOT NULL,
  kind text NOT NULL,
  input_type text NOT NULL,
  weight numeric,
  include_in_parent boolean NOT NULL,
  mapping_id text,
  unit text,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (version_id,node_id)
);

CREATE TABLE IF NOT EXISTS public.rule_version_mappings (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  version_id uuid NOT NULL REFERENCES public.rule_versions(id) ON DELETE CASCADE,
  mapping_id text NOT NULL,
  label text,
  unit text,
  direction text,
  kind text,
  mapping jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (version_id,mapping_id)
);

CREATE TABLE IF NOT EXISTS public.rule_activation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES public.rule_versions(id) ON DELETE CASCADE,
  previous_version_id uuid REFERENCES public.rule_versions(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('activate','rollback')),
  note text,
  performed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rule_update_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_snapshot_id uuid REFERENCES public.rtings_data_snapshots(id),
  rule_version_id uuid REFERENCES public.rule_versions(id),
  object_type text NOT NULL CHECK (object_type IN ('column','product','mapping','rule')),
  item_id text NOT NULL,
  title text NOT NULL,
  recommendation text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','deferred')),
  reviewer_id uuid,
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- app_create_data_snapshot / app_list_data_snapshots
-- 上传和查看 Rtings CSV 快照；仅系统管理员。
-- snapshot JSON 约定：{ columns: string[], rows: Array<Record<string,string>> }。

-- app_generate_data_diff / app_list_data_diffs / app_get_data_diff
-- 在服务端对比两个数据快照，生成新增列、移除列、新增/移除机型、逐列变更与逐单元格变更报告。

-- app_create_rule_version / app_list_rule_versions / app_get_rule_version
-- 创建规则版本快照，并把节点 / 映射写入索引表；首个版本自动 active。

-- app_change_rule_version_status / app_list_rule_activation_logs
-- 管理员激活新版本或回滚历史版本，写入激活日志；同一时间只有一个 active。

-- app_create_rule_review / app_list_rule_reviews / app_update_rule_review
-- 为后续 LLM 辅助审阅提供候选建议、审阅状态与备注留档。
