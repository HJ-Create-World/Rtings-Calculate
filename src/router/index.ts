import { createRouter, createWebHashHistory } from 'vue-router';
import ComparisonView from '../views/ComparisonView.vue';
import AboutView from '../views/AboutView.vue';
import HistoryView from '../views/HistoryView.vue';
import DrilldownView from '../views/DrilldownView.vue';
import EntryView from '../views/EntryView.vue';
import ImportView from '../views/ImportView.vue';
import CloudHistoryView from '../views/CloudHistoryView.vue';

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'comparison', component: ComparisonView },
    { path: '/overview', name: 'overview', component: AboutView },
    { path: '/history', name: 'history', component: HistoryView },
    { path: '/drilldown', name: 'drilldown', component: DrilldownView },
    { path: '/entry', name: 'entry', component: EntryView },
    { path: '/import', name: 'import', component: ImportView },
    { path: '/cloud', name: 'cloudHistory', component: CloudHistoryView },
    { path: '/trace', redirect: '/history' }
  ],
  scrollBehavior() {
    return { top: 0 };
  }
});
