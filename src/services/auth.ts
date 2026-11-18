import { cloud } from './cloud';

export type AppRole = 'admin' | 'engineer' | 'user';
export type AppStatus = 'active' | 'banned';

export interface AppPermissions {
  data_view: boolean;
  score_entry: boolean;
  test_method: boolean;
}

export interface AppUser {
  id: string;
  account: string;
  employeeNo: string;
  name: string;
  role: AppRole;
  status: AppStatus;
  permissions: AppPermissions;
  createdAt?: string;
  lastLoginAt?: string | null;
}

export interface AppSession {
  token: string;
  expiresAt: string;
  user: AppUser;
}

export interface RegisterInput {
  account: string;
  employeeNo: string;
  name: string;
  password: string;
}

export interface AppSystemStats {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  activeSessions: number;
  totalEvaluations: number;
  recentEvaluations: number;
}

const SESSION_KEY = 'rtings-calculate:app-session:v1';

function normalizePermissions(value: unknown): AppPermissions {
  const raw = (value ?? {}) as Partial<AppPermissions>;
  return {
    data_view: raw.data_view !== false,
    score_entry: raw.score_entry !== false,
    test_method: raw.test_method === true
  };
}

function normalizeUser(value: unknown): AppUser {
  const raw = value as Record<string, unknown>;
  return {
    id: String(raw.id),
    account: String(raw.account ?? ''),
    employeeNo: String(raw.employeeNo ?? ''),
    name: String(raw.name ?? ''),
    role: (String(raw.role ?? 'user') as AppRole),
    status: (String(raw.status ?? 'active') as AppStatus),
    permissions: normalizePermissions(raw.permissions),
    createdAt: raw.createdAt ? String(raw.createdAt) : undefined,
    lastLoginAt: raw.lastLoginAt ? String(raw.lastLoginAt) : null
  };
}

function normalizeSession(value: unknown): AppSession {
  const raw = value as Record<string, unknown>;
  return {
    token: String(raw.token ?? ''),
    expiresAt: String(raw.expiresAt ?? ''),
    user: normalizeUser(raw.user)
  };
}

function unwrap<T>(result: { data: T | null; error: unknown }): T {
  if (result.error) throw result.error;
  if (result.data === null || result.data === undefined) {
    throw new Error('云数据库返回空结果');
  }
  return result.data;
}

function readStoredSession(): AppSession | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = normalizeSession(JSON.parse(raw));
    return session.token ? session : null;
  } catch {
    return null;
  }
}

function writeStoredSession(session: AppSession | null) {
  if (typeof localStorage === 'undefined') return;
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function authErrorMessage(error: unknown, fallback = '操作失败'): string {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
}

export async function registerAppUser(input: RegisterInput): Promise<AppSession> {
  const result = unwrap(
    await cloud.database.rpc('app_register', {
      p_account: input.account,
      p_employee_no: input.employeeNo,
      p_name: input.name,
      p_password: input.password
    })
  );
  const session = normalizeSession(result);
  writeStoredSession(session);
  return session;
}

export async function loginAppUser(account: string, password: string): Promise<AppSession> {
  const result = unwrap(
    await cloud.database.rpc('app_login', {
      p_account: account,
      p_password: password
    })
  );
  const session = normalizeSession(result);
  writeStoredSession(session);
  return session;
}

export async function fetchCurrentUser(token: string): Promise<AppUser> {
  const result = unwrap(
    await cloud.database.rpc('app_current_user', { p_token: token })
  );
  return normalizeUser(result);
}

export async function logoutAppUser(token: string): Promise<void> {
  await cloud.database.rpc('app_logout', { p_token: token });
  writeStoredSession(null);
}

export async function changeAppPassword(
  token: string,
  oldPassword: string,
  newPassword: string
): Promise<AppUser> {
  const result = unwrap(
    await cloud.database.rpc('app_change_password', {
      p_token: token,
      p_old_password: oldPassword,
      p_new_password: newPassword
    })
  );
  return normalizeUser(result);
}

export async function listAppUsers(token: string): Promise<AppUser[]> {
  const result = unwrap(
    await cloud.database.rpc('app_list_users', { p_token: token })
  );
  return Array.isArray(result) ? result.map(normalizeUser) : [];
}

export async function updateAppUser(
  token: string,
  userId: string,
  patch: {
    role: AppRole;
    status: AppStatus;
    permissions: AppPermissions;
    employeeNo?: string;
    name?: string;
  }
): Promise<AppUser> {
  const result = unwrap(
    await cloud.database.rpc('app_update_user', {
      p_token: token,
      p_user_id: userId,
      p_role: patch.role,
      p_status: patch.status,
      p_permissions: patch.permissions,
      p_employee_no: patch.employeeNo ?? null,
      p_name: patch.name ?? null
    })
  );
  return normalizeUser(result);
}

export async function fetchAppSystemStats(token: string): Promise<AppSystemStats> {
  const result = unwrap(
    await cloud.database.rpc('app_system_stats', { p_token: token })
  );
  return result as AppSystemStats;
}

export function storedAppSession(): AppSession | null {
  return readStoredSession();
}

export function setStoredAppSession(session: AppSession | null) {
  writeStoredSession(session);
}
