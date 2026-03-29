import { Assistant, AssistantConversationMessage } from '@rapidaai/react';
import { toDate, toDateString } from '@/utils/date';
import {
  getStatusMetric,
  getTimeTakenMetric,
  getTotalTokenMetric,
} from '@/utils/metadata';
import {
  XAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Bar,
  BarChart,
  YAxis,
  AreaChart,
  Area,
} from 'recharts';
import {
  NameType,
  ValueType,
} from 'recharts/types/component/DefaultTooltipContent';
import { ContentType } from 'recharts/types/component/Tooltip';
import { useAssistantTracePageStore } from '@/hooks/use-assistant-trace-page-store';
import { FC, useEffect, useState } from 'react';
import { cn } from '@/utils';
import { useCurrentCredential } from '@/hooks/use-credential';
import { Dropdown, Tile } from '@carbon/react';

const CHART_COLORS = [
  'var(--cds-interactive, #1e40af)',
  '#22d3ee',
  '#f59e0b',
  '#10b981',
  '#f43f5e',
  '#8b5cf6',
];

const DATE_RANGES = [
  { id: 'last_24_hours', text: 'Last 24 hours' },
  { id: 'last_3_days', text: 'Last 3 days' },
  { id: 'last_7_days', text: 'Last 7 days' },
  { id: 'last_30_days', text: 'Last 30 days' },
];

const AUTO_REFRESH_OPTIONS = [
  { id: '0', text: 'Off' },
  { id: '5', text: 'Every 5 min' },
  { id: '10', text: 'Every 10 min' },
  { id: '30', text: 'Every 30 min' },
];

export const AssistantAnalytics: FC<{ assistant: Assistant }> = props => {
  const assistantTraceAction = useAssistantTracePageStore();
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<null | number>(null);
  const [selectedRange, setSelectedRange] = useState<string>('last_30_days');
  const { authId, token, projectId } = useCurrentCredential();

  const getDateRangeCriteria = (range: string) => {
    const now = new Date();
    let startDate: Date;
    switch (range) {
      case 'last_24_hours': startDate = new Date(now.setDate(now.getDate() - 1)); break;
      case 'last_3_days': startDate = new Date(now.setDate(now.getDate() - 3)); break;
      case 'last_7_days': startDate = new Date(now.setDate(now.getDate() - 7)); break;
      default: startDate = new Date(now.setDate(now.getDate() - 30));
    }
    return { k: 'assistant_conversation_messages.created_date', v: toDateString(startDate), logic: '>=' };
  };

  useEffect(() => {
    assistantTraceAction.clear();
    assistantTraceAction.addCriterias([getDateRangeCriteria(selectedRange)]);
  }, []);

  useEffect(() => {
    fetchAssistantMessages();
  }, [props.assistant.getId(), projectId, selectedRange, JSON.stringify(assistantTraceAction.criteria), token, authId]);

  const conversationsMap = assistantTraceAction.assistantMessages.reduce((acc, message) => {
    const id = message.getAssistantconversationid();
    if (!acc.has(id)) acc.set(id, []);
    acc.get(id)!.push(message);
    return acc;
  }, new Map<string, AssistantConversationMessage[]>());

  const conversations = Array.from(conversationsMap.values());
  const totalSessions = conversations.length;
  const totalMessages = assistantTraceAction.assistantMessages.length;

  const avgDuration = conversations.reduce((sum, conv) => {
    const sorted = conv.sort((a, b) => toDate(a.getCreateddate()!).getTime() - toDate(b.getCreateddate()!).getTime());
    return sum + (toDate(sorted[sorted.length - 1].getCreateddate()!).getTime() - toDate(sorted[0].getCreateddate()!).getTime()) / 1000;
  }, 0) / totalSessions;

  const avgLatency = assistantTraceAction.assistantMessages.reduce((sum, m) => sum + getTimeTakenMetric(m.getMetricsList()), 0) / totalMessages;

  const successRate = (assistantTraceAction.assistantMessages.filter(m => getStatusMetric(m.getMetricsList()) === 'SUCCESS').length / totalMessages) * 100;

  const totalTokens = assistantTraceAction.assistantMessages.reduce((sum, m) => sum + getTotalTokenMetric(m.getMetricsList()), 0);
  const tokenPerMessage = totalTokens / totalMessages;

  const totalDuration = conversations.reduce((sum, conv) => {
    const sorted = conv.sort((a, b) => toDate(a.getCreateddate()!).getTime() - toDate(b.getCreateddate()!).getTime());
    return sum + (toDate(sorted[sorted.length - 1].getCreateddate()!).getTime() - toDate(sorted[0].getCreateddate()!).getTime()) / 1000;
  }, 0);

  const activeConversations = props.assistant.getAssistantconversationsList().length;

  const languageData = Object.entries(
    assistantTraceAction.assistantMessages.reduce((acc, item) => {
      const lang = item.getMetadataList().find(m => m.getKey() === 'language')?.getValue() || 'Unknown';
      acc[lang] = (acc[lang] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  ).map(([language, count]) => ({ language, count, percentage: ((count / totalMessages) * 100).toFixed(1) }));

  const sourceData = Object.entries(
    assistantTraceAction.assistantMessages.reduce((acc, item) => {
      const source = item.getSource();
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  ).map(([source, count]) => ({ source, count, percentage: ((count / totalMessages) * 100).toFixed(1) }));

  const activeSessionsData = (() => {
    const now = new Date();
    let interval: number;
    let formatLabel: (d: Date) => string;
    switch (selectedRange) {
      case 'last_24_hours': interval = 30; formatLabel = d => `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`; break;
      case 'last_7_days': interval = 240; formatLabel = d => `${toDateString(d)} ${d.getHours().toString().padStart(2, '0')}:00`; break;
      default: interval = 1440; formatLabel = d => toDateString(d);
    }
    const startTime = new Date(); startTime.setMinutes(0, 0, 0);
    switch (selectedRange) {
      case 'last_24_hours': startTime.setDate(startTime.getDate() - 1); break;
      case 'last_7_days': startTime.setDate(startTime.getDate() - 7); break;
      default: startTime.setDate(startTime.getDate() - 30);
    }
    const buckets: Array<{ date: Date; total: number; latency: number }> = [];
    for (let t = startTime.getTime(); t < now.getTime(); t += interval * 60 * 1000) buckets.push({ date: new Date(t), total: 0, latency: 0 });
    assistantTraceAction.assistantMessages.forEach(m => {
      const idx = Math.floor((toDate(m.getCreateddate()!).getTime() - startTime.getTime()) / (interval * 60 * 1000));
      if (idx >= 0 && idx < buckets.length) { buckets[idx].total += 1; buckets[idx].latency += getTimeTakenMetric(m.getMetricsList()) / 1000000; }
    });
    return buckets.map(b => ({ dateHour: formatLabel(b.date), total: b.total, latency: Math.round(b.latency / Math.max(1, b.total)), label: `From: ${b.date.toISOString().split('.')[0].replace('T', ' ')}` }));
  })();

  const fetchAssistantMessages = () => {
    assistantTraceAction.setPageSize(0);
    assistantTraceAction.setFields(['metadata', 'metric']);
    assistantTraceAction.addCriterias([getDateRangeCriteria(selectedRange)]);
    assistantTraceAction.getAssistantMessages(props.assistant.getId(), projectId, token, authId, () => {}, () => {});
  };

  useEffect(() => {
    let id: NodeJS.Timeout | null = null;
    if (autoRefreshInterval && autoRefreshInterval > 0) id = setInterval(() => fetchAssistantMessages(), autoRefreshInterval * 60 * 1000);
    return () => { if (id) clearInterval(id); };
  }, [autoRefreshInterval]);

  return (
    <div className="w-full p-4 space-y-4">
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
          Summary Dashboard
        </h2>
        <div className="flex items-center gap-2">
          <Dropdown
            id="date-range"
            titleText=""
            hideLabel
            label="Date range"
            size="sm"
            items={DATE_RANGES}
            selectedItem={DATE_RANGES.find(r => r.id === selectedRange)}
            itemToString={(item: any) => item?.text || ''}
            onChange={({ selectedItem }) => { if (selectedItem) setSelectedRange(selectedItem.id); }}
            className="min-w-[160px]"
          />
          <Dropdown
            id="auto-refresh"
            titleText=""
            hideLabel
            label="Auto-refresh"
            size="sm"
            items={AUTO_REFRESH_OPTIONS}
            selectedItem={AUTO_REFRESH_OPTIONS.find(o => o.id === String(autoRefreshInterval || 0))}
            itemToString={(item: any) => item?.text || ''}
            onChange={({ selectedItem }) => { if (selectedItem) setAutoRefreshInterval(selectedItem.id === '0' ? null : Number(selectedItem.id)); }}
            className="min-w-[140px]"
          />
        </div>
      </div>

      {/* ── Metric cards — top row ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard label="Sessions" value={totalSessions} trend="up" status={totalSessions > 0 ? 'active' : 'inactive'} />
        <MetricCard label="Active Conversations" value={activeConversations} trend="up" status={activeConversations > 0 ? 'active' : 'inactive'} />
        <MetricCard label="Total Tokens" value={totalTokens} trend="up" status={totalTokens > 0 ? 'active' : 'inactive'} />
        <MetricCard label="Total Duration" value={Math.round(totalDuration)} unit="s" status="active" />
        <MetricCard label="Avg Latency" value={Math.round(avgLatency / 1000000)} unit="ms" trend={avgLatency / 1000000 > 2000 ? 'down' : 'up'} status={avgLatency / 1000000 > 2000 ? 'warning' : 'active'} />
        <MetricCard label="Success Rate" value={Number(successRate.toFixed(1))} unit="%" trend="up" status={successRate > 90 ? 'active' : successRate > 50 ? 'warning' : 'inactive'} />
      </div>

      {/* ── Second row — gauge + sparkline + donut ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Language gauge */}
        <ChartTile title="Languages">
          <div className="flex flex-col items-center py-4">
            <div className="relative h-[140px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={languageData.length > 0 ? languageData : [{ language: 'No data', count: 1 }]}
                    cx="50%"
                    cy="80%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="count"
                    nameKey="language"
                    stroke="none"
                  >
                    {languageData.length > 0
                      ? languageData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))
                      : <Cell fill="#e0e0e0" />
                    }
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-center">
                <p className="text-lg font-bold tabular-nums">{languageData.length}</p>
                <p className="text-[10px] text-gray-400 uppercase">Languages</p>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-3 px-4 pb-2">
              {languageData.map((item, i) => (
                <div key={item.language} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2 h-2 shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-gray-600 dark:text-gray-400 capitalize">{item.language}</span>
                  <span className="font-semibold tabular-nums">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </ChartTile>

        {/* Latency sparkline */}
        <ChartTile title="Latency">
          <div className="flex items-center justify-between px-4 pt-2 pb-1">
            <p className="text-2xl font-light tabular-nums">{Math.round(avgLatency / 1000000)} <span className="text-sm text-gray-500 uppercase">ms</span></p>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
          </div>
          <div className="h-[120px] px-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activeSessionsData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--cds-interactive, #1e40af)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--cds-interactive, #1e40af)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="latency"
                  stroke="var(--cds-interactive, #1e40af)"
                  strokeWidth={1.5}
                  fill="url(#latencyGradient)"
                  dot={false}
                  activeDot={{ r: 3, fill: 'var(--cds-interactive, #1e40af)' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartTile>

        {/* Source donut */}
        <ChartTile title="Sources">
          <DonutContent data={sourceData} dataKey="count" nameKey="source" total={totalMessages} />
        </ChartTile>
      </div>

      {/* ── Full-width sessions chart ── */}
      <ChartTile title="Sessions">
        <div className="h-[260px] px-2 py-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activeSessionsData} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
              <YAxis dataKey="total" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} width={36} />
              <XAxis dataKey="dateHour" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} interval="preserveStartEnd" />
              <Tooltip
                cursor={{ fill: 'var(--cds-interactive, #1e40af)', fillOpacity: 0.06 }}
                content={(({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg px-3 py-2.5 text-sm min-w-[140px]">
                      <p className="text-gray-400 text-xs mb-1.5">{payload[0]?.payload?.label}</p>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2" style={{ backgroundColor: 'var(--cds-interactive, #1e40af)' }} />
                        <span className="text-gray-600 dark:text-gray-300">Sessions</span>
                        <span className="ml-auto font-semibold tabular-nums">{payload[0]?.value}</span>
                      </div>
                    </div>
                  );
                }) as ContentType<ValueType, NameType>}
              />
              <Bar dataKey="total" fill="var(--cds-interactive, #1e40af)" fillOpacity={0.85} radius={[2, 2, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartTile>
    </div>
  );
};

// ─── Metric card (IBM Carbon dashboard pattern) ─────────────────────────────

const MetricCard: FC<{ label: string; value: number; unit?: string; trend?: 'up' | 'down'; status?: 'active' | 'inactive' | 'warning' }> = ({
  label, value, unit, trend, status = 'active',
}) => {
  const statusColor = status === 'active' ? 'bg-green-500' : status === 'warning' ? 'bg-yellow-500' : 'bg-gray-400';
  return (
    <Tile className="!rounded-none !p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold">{label}</h4>
        <span className={cn('w-2 h-2 rounded-full shrink-0', statusColor)} />
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-light tabular-nums tracking-tight">
          {isNaN(value) ? '–' : value.toLocaleString()}
        </span>
        {unit && (
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400 uppercase">
            {unit}
          </span>
        )}
        {trend && (
          <span className={cn('text-sm font-semibold ml-1', trend === 'up' ? 'text-green-600' : 'text-red-500')}>
            {trend === 'up' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </Tile>
  );
};

// ─── Chart tile wrapper ──────────────────────────────────────────────────────

const ChartTile: FC<{ title: string; subtitle?: string; className?: string; children: React.ReactNode }> = ({
  title, subtitle, className, children,
}) => (
  <Tile className={cn('!rounded-none !p-0', className)}>
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
      <h3 className="text-base font-semibold">{title}</h3>
      {subtitle && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
      )}
    </div>
    {children}
  </Tile>
);

// ─── Donut chart content ─────────────────────────────────────────────────────

const DonutContent: FC<{ data: any[]; dataKey: string; nameKey: string; total: number }> = ({
  data, dataKey, nameKey, total,
}) => (
  <>
    <div className="relative h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" labelLine={false} outerRadius={80} innerRadius={50} dataKey={dataKey} nameKey={nameKey} stroke="none">
            {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
          </Pie>
          <Tooltip
            content={(({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const item = payload[0];
              return (
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 shrink-0" style={{ backgroundColor: item.color || '#6366f1' }} />
                    <span className="capitalize">{item.name || 'Unknown'}</span>
                    <span className="ml-3 font-semibold">{item.value}</span>
                  </div>
                </div>
              );
            }) as ContentType<ValueType, NameType>}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <p className="text-lg font-bold tabular-nums">{total}</p>
          <p className="text-[10px] text-gray-400 uppercase">Total</p>
        </div>
      </div>
    </div>
    <div className="px-4 pb-4 pt-2 space-y-2">
      {data.map((item, i) => (
        <div key={item[nameKey]} className="flex items-center gap-2 text-xs">
          <div className="w-2.5 h-2.5 shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
          <span className="text-gray-600 dark:text-gray-400 truncate flex-1 capitalize">{item[nameKey] || 'Unknown'}</span>
          <span className="font-semibold tabular-nums">{item.percentage}%</span>
          <span className="text-gray-400 tabular-nums">({item.count})</span>
        </div>
      ))}
    </div>
  </>
);
