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
