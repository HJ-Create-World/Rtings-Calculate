import { createRouter, createWebHashHistory } from 'vue-router';
import ComparisonView from '../views/ComparisonView.vue';
import AboutView from '../views/AboutView.vue';
import HistoryView from '../views/HistoryView.vue';
import DrilldownView from '../views/DrilldownView.vue';
import EntryView from '../views/EntryView.vue';
import CloudHistoryView from '../views/CloudHistoryView.vue';
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
import AdminView from '../views/AdminView.vue';
import TestMethodsView from '../views/TestMethodsView.vue';
import AccessDeniedView from '../views/AccessDeniedView.vue';
import { useAuth } from '../composables/useAuth';
import { initializeRuleRuntime } from '../composables/useRuleRuntime';

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'comparison', component: ComparisonView, meta: { permission: 'data_view' } },
    { path: '/overview', name: 'overview', component: AboutView, meta: { permission: 'data_view' } },
    { path: '/history', name: 'history', component: HistoryView, meta: { permission: 'data_view' } },
    { path: '/drilldown', name: 'drilldown', component: DrilldownView, meta: { permission: 'data_view' } },
    { path: '/entry', name: 'entry', component: EntryView, meta: { permission: 'score_entry' } },
    { path: '/import', redirect: '/entry' },
    { path: '/cloud', name: 'cloudHistory', component: CloudHistoryView, meta: { permission: 'data_view' } },
    { path: '/methods', name: 'testMethods', component: TestMethodsView, meta: { permission: 'test_method' } },
    { path: '/admin', name: 'admin', component: AdminView, meta: { requiresAdmin: true } },
    { path: '/login', name: 'login', component: LoginView, meta: { public: true } },
    { path: '/register', name: 'register', component: RegisterView, meta: { public: true } },
    { path: '/forbidden', name: 'forbidden', component: AccessDeniedView, meta: { public: true } },
    { path: '/trace', redirect: '/history' }
  ],
  scrollBehavior() {
    return { top: 0 };
  }
});

router.beforeEach(async to => {
  const auth = useAuth();
  await auth.initializeAuth();
  await initializeRuleRuntime();

  if (to.meta.public) return true;

  if (!auth.isLoggedIn.value) {
    return { path: '/login', query: { redirect: to.fullPath } };
  }
  if (to.meta.requiresAdmin && !auth.isAdmin.value) {
    return { path: '/forbidden' };
  }
  const permission = to.meta.permission as 'data_view' | 'score_entry' | 'test_method' | undefined;
  if (permission && !auth.hasPermission(permission)) {
    return { path: '/forbidden' };
  }
  return true;
});
