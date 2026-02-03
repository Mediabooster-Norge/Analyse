'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface HistoryEntry {
  id: string;
  createdAt: string;
  overallScore: number;
  seoScore: number;
  contentScore: number;
  securityScore: number;
  performanceScore: number | null;
}

interface ScoreTrendChartProps {
  history: HistoryEntry[];
  currentScore: number;
}

export function ScoreTrendChart({ history, currentScore }: ScoreTrendChartProps) {
  const chartData = useMemo(() => {
    return history.map((entry, index) => ({
      name: new Date(entry.createdAt).toLocaleDateString('nb-NO', {
        day: 'numeric',
        month: 'short',
      }),
      fullDate: new Date(entry.createdAt).toLocaleDateString('nb-NO', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      Totalt: entry.overallScore,
      SEO: entry.seoScore,
      Innhold: entry.contentScore,
      Sikkerhet: entry.securityScore,
      Hastighet: entry.performanceScore ?? undefined,
      index,
    }));
  }, [history]);

  // Calculate trend (comparing first and last entries)
  const trend = useMemo(() => {
    if (history.length < 2) return { direction: 'stable' as const, change: 0 };
    const first = history[0].overallScore;
    const last = history[history.length - 1].overallScore;
    const change = last - first;
    return {
      direction: change > 0 ? 'up' as const : change < 0 ? 'down' as const : 'stable' as const,
      change: Math.abs(change),
    };
  }, [history]);

  if (history.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-3">
          <TrendingUp className="w-6 h-6 text-neutral-400" />
        </div>
        <p className="text-sm text-neutral-600 font-medium mb-1">Ikke nok data for trendvisning</p>
        <p className="text-xs text-neutral-500">Kjør flere analyser for å se utviklingen over tid</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Trend summary */}
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          trend.direction === 'up' ? 'bg-green-100' : 
          trend.direction === 'down' ? 'bg-red-100' : 'bg-neutral-100'
        }`}>
          {trend.direction === 'up' ? (
            <TrendingUp className="w-5 h-5 text-green-600" />
          ) : trend.direction === 'down' ? (
            <TrendingDown className="w-5 h-5 text-red-600" />
          ) : (
            <Minus className="w-5 h-5 text-neutral-500" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-neutral-900">
            {trend.direction === 'up' 
              ? `Forbedret med ${trend.change} poeng` 
              : trend.direction === 'down'
                ? `Redusert med ${trend.change} poeng`
                : 'Stabil score'
            }
          </p>
          <p className="text-xs text-neutral-500">
            Basert på {history.length} analyser
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[200px] sm:h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 10, fill: '#737373' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e5e5' }}
            />
            <YAxis 
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: '#737373' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e5e5' }}
              width={35}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '12px',
              }}
              labelFormatter={(_, payload) => {
                const item = payload?.[0]?.payload;
                return item?.fullDate || '';
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              iconType="circle"
              iconSize={8}
            />
            <Line 
              type="monotone" 
              dataKey="Totalt" 
              stroke="#171717" 
              strokeWidth={2}
              dot={{ r: 3, fill: '#171717' }}
              activeDot={{ r: 5 }}
            />
            <Line 
              type="monotone" 
              dataKey="SEO" 
              stroke="#3b82f6" 
              strokeWidth={1.5}
              dot={{ r: 2, fill: '#3b82f6' }}
              strokeDasharray="5 5"
            />
            <Line 
              type="monotone" 
              dataKey="Innhold" 
              stroke="#8b5cf6" 
              strokeWidth={1.5}
              dot={{ r: 2, fill: '#8b5cf6' }}
              strokeDasharray="5 5"
            />
            <Line 
              type="monotone" 
              dataKey="Sikkerhet" 
              stroke="#22c55e" 
              strokeWidth={1.5}
              dot={{ r: 2, fill: '#22c55e' }}
              strokeDasharray="5 5"
            />
            {chartData.some(d => d.Hastighet !== undefined) && (
              <Line 
                type="monotone" 
                dataKey="Hastighet" 
                stroke="#f59e0b" 
                strokeWidth={1.5}
                dot={{ r: 2, fill: '#f59e0b' }}
                strokeDasharray="5 5"
                connectNulls
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
