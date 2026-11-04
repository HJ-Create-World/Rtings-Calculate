import { createRouter, createWebHashHistory } from 'vue-router';
import OverviewView from '../views/OverviewView.vue';
import ComparisonView from '../views/ComparisonView.vue';
import DrilldownView from '../views/DrilldownView.vue';
import TraceView from '../views/TraceView.vue';

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'overview', component: OverviewView },
    { path: '/comparison', name: 'comparison', component: ComparisonView },
    { path: '/drilldown', name: 'drilldown', component: DrilldownView },
    { path: '/trace', name: 'trace', component: TraceView }
  ],
  scrollBehavior() {
    return { top: 0 };
  }
});
