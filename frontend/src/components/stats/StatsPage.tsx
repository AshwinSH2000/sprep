import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useStats } from '../../queries/useStats'

// Recharts writes these straight into SVG attributes, where the CSS custom
// properties from the @theme block resolve — keeping the charts on the same
// locked tokens as the rest of the app.
const ACCENT = 'var(--color-accent)'
const GRID = 'var(--color-border)'
const TICK = { fill: 'var(--color-text-muted)', fontSize: 11 }

const tooltipProps = {
  cursor: { fill: 'var(--color-bg-input)' },
  contentStyle: {
    backgroundColor: 'var(--color-bg-input)',
    border: '1px solid var(--color-border)',
    borderRadius: '0.5rem',
    color: 'var(--color-text)',
  },
  labelStyle: { color: 'var(--color-text)' },
  itemStyle: { color: 'var(--color-text-secondary)' },
} as const

function formatWeekStart(isoDate: string): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(
    new Date(isoDate),
  )
}

function StatTile({ value, label, detail }: { value: string; label: string; detail?: string }) {
  return (
    <div className="rounded-lg border border-border bg-bg-card px-4 py-3">
      <p className="text-2xl font-semibold text-text">{value}</p>
      <p className="text-sm text-text-secondary">{label}</p>
      {detail && <p className="mt-1 text-xs text-text-muted">{detail}</p>}
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold text-text-secondary">{title}</h2>
      {children}
    </div>
  )
}

export function StatsPage() {
  const { data } = useStats()

  return (
    <>
      <h1 className="text-3xl font-semibold text-text">Stats</h1>
      <p className="mb-6">
        <Link to="/" className="text-sm text-accent hover:text-accent-hover">
          ← Back to SpRep
        </Link>
      </p>

      {!data ? (
        <p className="text-sm text-text-muted">Loading stats…</p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatTile
              value={String(data.current_streak)}
              label={data.current_streak === 1 ? 'day streak' : 'days streak'}
              detail="Consecutive days writing or reviewing"
            />
            <StatTile
              value={String(data.review_activity.total_reviews)}
              label="reviews completed"
            />
            <StatTile
              value={
                data.review_activity.on_time_rate === null
                  ? '—'
                  : `${Math.round(data.review_activity.on_time_rate * 100)}%`
              }
              label="reviewed on time"
              detail={`${data.review_activity.on_time} on time · ${data.review_activity.late} late`}
            />
          </div>

          <ChartCard title="Entries written per week">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.entries_per_week} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={GRID} strokeOpacity={0.5} />
                <XAxis
                  dataKey="week_start"
                  tickFormatter={formatWeekStart}
                  tick={TICK}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis allowDecimals={false} tick={TICK} axisLine={false} tickLine={false} />
                <Tooltip
                  {...tooltipProps}
                  labelFormatter={(value) => `Week of ${formatWeekStart(String(value))}`}
                  formatter={(value) => [value, 'entries']}
                />
                <Bar
                  dataKey="count"
                  fill={ACCENT}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={20}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Entries by stage">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.stage_distribution} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={GRID} strokeOpacity={0.5} />
                <XAxis dataKey="label" tick={TICK} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={TICK} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipProps} formatter={(value) => [value, 'entries']} />
                <Bar
                  dataKey="count"
                  fill={ACCENT}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={20}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}
    </>
  )
}
