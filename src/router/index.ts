import { createRouter, createWebHashHistory } from 'vue-router';
import OverviewView from '../views/OverviewView.vue';
import ComparisonView from '../views/ComparisonView.vue';
import DrilldownView from '../views/DrilldownView.vue';
import TraceView from '../views/TraceView.vue';
import EntryView from '../views/EntryView.vue';
import ImportView from '../views/ImportView.vue';

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'overview', component: OverviewView },
    { path: '/comparison', name: 'comparison', component: ComparisonView },
    { path: '/drilldown', name: 'drilldown', component: DrilldownView },
    { path: '/trace', name: 'trace', component: TraceView },
    { path: '/entry', name: 'entry', component: EntryView },
    { path: '/import', name: 'import', component: ImportView }
  ],
  scrollBehavior() {
    return { top: 0 };
  }
});
