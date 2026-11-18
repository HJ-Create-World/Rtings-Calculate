import { computed, ref } from 'vue';
import {
  authErrorMessage,
  changeAppPassword,
  fetchCurrentUser,
  loginAppUser,
  logoutAppUser,
  registerAppUser,
  storedAppSession,
  setStoredAppSession,
  type AppSession,
  type AppUser,
  type RegisterInput
} from '../services/auth';

const session = ref<AppSession | null>(storedAppSession());
const initializing = ref(Boolean(session.value));
const submitting = ref(false);
const initialized = ref(false);
let initPromise: Promise<void> | null = null;

const currentUser = computed(() => session.value?.user ?? null);
const isAdmin = computed(() => currentUser.value?.role === 'admin');
const isLoggedIn = computed(() => Boolean(currentUser.value));

function hasPermission(permission: 'data_view' | 'score_entry' | 'test_method'): boolean {
  const user = currentUser.value;
  if (!user || user.status !== 'active') return false;
  if (user.role === 'admin') return true;
  return user.permissions[permission] === true;
}

const canViewData = computed(() => hasPermission('data_view'));
const canEnterScore = computed(() => hasPermission('score_entry'));
const canViewTestMethod = computed(() => hasPermission('test_method'));

async function initializeAuth(): Promise<void> {
  if (initialized.value) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    initializing.value = true;
    const current = session.value;
    if (!current?.token) {
      session.value = null;
      setStoredAppSession(null);
      initialized.value = true;
      return;
    }

    try {
      const user = await fetchCurrentUser(current.token);
      session.value = { ...current, user };
      setStoredAppSession(session.value);
    } catch {
      session.value = null;
      setStoredAppSession(null);
    } finally {
      initializing.value = false;
      initialized.value = true;
    }
  })();

  return initPromise;
}

async function login(account: string, password: string) {
  submitting.value = true;
  try {
    session.value = await loginAppUser(account, password);
    initialized.value = true;
    return session.value;
  } catch (error) {
    throw new Error(authErrorMessage(error, '登录失败'));
  } finally {
    submitting.value = false;
  }
}

async function register(input: RegisterInput) {
  submitting.value = true;
  try {
    session.value = await registerAppUser(input);
    initialized.value = true;
    return session.value;
  } catch (error) {
    throw new Error(authErrorMessage(error, '注册失败'));
  } finally {
    submitting.value = false;
  }
}

async function logout() {
  const current = session.value;
  submitting.value = true;
  try {
    if (current?.token) await logoutAppUser(current.token);
  } catch {
    setStoredAppSession(null);
  } finally {
    session.value = null;
    submitting.value = false;
  }
}

async function changePassword(oldPassword: string, newPassword: string) {
  if (!session.value?.token) throw new Error('请先登录');
  submitting.value = true;
  try {
    const user = await changeAppPassword(
      session.value.token,
      oldPassword,
      newPassword
    );
    session.value = { ...session.value, user };
    setStoredAppSession(session.value);
  } catch (error) {
    throw new Error(authErrorMessage(error, '修改密码失败'));
  } finally {
    submitting.value = false;
  }
}

function refreshUser(user: AppUser) {
  if (!session.value) return;
  session.value = { ...session.value, user };
  setStoredAppSession(session.value);
}

export function useAuth() {
  return {
    session,
    currentUser,
    initializing,
    initialized,
    submitting,
    isLoggedIn,
    isAdmin,
    hasPermission,
    canViewData,
    canEnterScore,
    canViewTestMethod,
    initializeAuth,
    login,
    register,
    logout,
    changePassword,
    refreshUser
  };
}
