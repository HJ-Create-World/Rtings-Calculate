import Chart from 'chart.js/auto';

Chart.defaults.font.family = '"Microsoft YaHei", "PingFang SC", system-ui, sans-serif';
Chart.defaults.font.size = 12;
Chart.defaults.color = '#374151';
Chart.defaults.borderColor = '#e5e7eb';
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.boxWidth = 8;
Chart.defaults.plugins.tooltip.backgroundColor = '#111827';
Chart.defaults.plugins.tooltip.titleColor = '#f9fafb';
Chart.defaults.plugins.tooltip.bodyColor = '#e5e7eb';
Chart.defaults.plugins.tooltip.borderColor = '#374151';
Chart.defaults.plugins.tooltip.borderWidth = 1;
Chart.defaults.elements.bar.borderRadius = 6;
Chart.defaults.elements.point.radius = 3;

export const corporatePalette = ['#2563eb', '#0ea5e9', '#64748b', '#f59e0b'];
