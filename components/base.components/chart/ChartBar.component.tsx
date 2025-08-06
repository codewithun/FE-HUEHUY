import React, { useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import {
  ArcElement,
  PointElement,
  LineElement,
  Filler,
  RadialLinearScale,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
  RadialLinearScale
);

export type datasetItemProps = {
  label: string;
  data: number[];
  color?: string;
};

export type ChartBarProps = {
  labels: string[];
  datasets: datasetItemProps[];
  vertical?: boolean;
  header?: any;
  loading?: boolean;
};

export function ChartBarComponent({
  labels,
  datasets,
  vertical,
  header,
  loading,
}: ChartBarProps) {
  const chartRef = useRef(null);

  const data: { labels: string[]; datasets: any } = {
    labels,
    datasets: [],
  };

  const options: ChartOptions<'bar'> = {
    indexAxis: vertical ? 'x' : 'y',
    plugins: {
      title: {
        display: false,
      },
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#4AA96C',
        padding: 12,
        displayColors: false,
      },
    },
    scales: {
      y: {
        suggestedMax: 30,
      },
      x: {
        suggestedMax: 30,
        grid: {
          color: '#00000000',
        },
      },
    },
  };

  datasets.map((dataset: datasetItemProps) => {
    let background = dataset.color || '#4AA96C70';
    data.datasets.push({
      label: dataset.label,
      data: dataset.data,
      backgroundColor: background,
      borderRadius: 8,
      fill: true,
      borderColor: background,
    });
  });

  return (
    <div
      className={`py-4 px-6 bg-white rounded-lg shadow ${
        loading && 'skeleton__loading'
      }`}
    >
      {header}
      <Bar ref={chartRef} options={options} data={data} />
    </div>
  );
}
