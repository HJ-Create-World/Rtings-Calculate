import Chart from 'chart.js/auto';
import { corporatePalette } from './chartTheme';
import type { ScoreNode } from '../core/types';
import type { ProductBaseline } from '../data/rtingsRule';

function renderChartPng(config: any, width = 1200, height = 640): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('无法创建图表画布');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);

  const chart = new Chart(context, {
    ...config,
    options: {
      ...(config.options ?? {}),
      responsive: false,
      animation: false,
      devicePixelRatio: 2
    }
  });
  const png = chart.toBase64Image('image/png', 1);
  chart.destroy();
  return png;
}

export function createTotalScoreChartImage(
  products: Array<{ label: string; value: number | null }>
): string {
  return renderChartPng({
    type: 'bar',
    data: {
      labels: products.map(item => item.label),
      datasets: [
        {
          label: 'Mixed Usage 总分',
          data: products.map(item => item.value),
          backgroundColor: products.map(
            (_, index) => `${corporatePalette[index % corporatePalette.length]}D9`
          ),
          borderRadius: 8,
          maxBarThickness: 44
        }
      ]
    },
    options: {
      indexAxis: 'y',
      plugins: { legend: { display: false } },
      scales: {
        x: { beginAtZero: true, suggestedMax: 10, grid: { color: '#f3f4f6' } },
        y: { grid: { display: false } }
      }
    }
  });
}

export function createGroupRadarChartImage(
  labels: string[],
  values: Array<number | null>,
  label: string
): string {
  return renderChartPng({
    type: 'radar',
    data: {
      labels,
      datasets: [
        {
          label,
          data: values,
          borderColor: corporatePalette[0],
          backgroundColor: `${corporatePalette[0]}26`,
          pointBackgroundColor: corporatePalette[0],
          borderWidth: 2
        }
      ]
    },
    options: {
      plugins: { legend: { position: 'bottom' } },
      scales: {
        r: {
          min: 0,
          max: 10,
          ticks: { stepSize: 2, backdropColor: 'transparent' },
          grid: { color: '#f3f4f6' },
          angleLines: { color: '#e5e7eb' },
          pointLabels: { color: '#374151' }
        }
      }
    }
  });
}

export function createGroupContributionChartImage(
  groups: ScoreNode[],
  product: ProductBaseline
): string {
  return renderChartPng({
    type: 'bar',
    data: {
      labels: groups.map(group => group.label),
      datasets: [
        {
          label: '贡献值',
          data: groups.map(group => (product.expectedScores[group.id] ?? 0) * (group.weight ?? 0)),
          backgroundColor: `${corporatePalette[0]}D9`,
          borderRadius: 8,
          maxBarThickness: 36
        }
      ]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          grid: { color: '#f3f4f6' },
          title: { display: true, text: '对 Mixed Usage 的贡献值' }
        }
      }
    }
  });
}
