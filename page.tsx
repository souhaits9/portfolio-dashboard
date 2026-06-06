'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine, PieChart, Pie, Legend
} from 'recharts'

// ── 타입 정의
interface PortfolioData {
  totalValue: number
  totalTodayChange: number
  accountSummary: { account: string; value: number; todayChange: number; count: number }[]
  stockSummary: { name: string; value: number; todayChange: number }[]
}
interface AllocationData {
  allocations: { name: string; amount: number; current: number; target: number; diff: number }[]
}
interface SummaryData {
  monthly: { label: string; year: number; month: number; asset: number; profit: number; rate: number }[]
}

// ── 유틸
const fmt = (n: number) => new Intl.NumberFormat('ko-KR').format(Math.round(n))
const fmtCompact = (n: number) => {
  const abs = Math.abs(n)
  if (abs >= 1e8) return `${(n / 1e8).toFixed(1)}억`
  if (abs >= 1e4) return `${(n / 1e4).toFixed(0)}만`
  return fmt(n)
}
const fmtPct = (n: number, plus = true) => `${plus && n > 0 ? '+' : ''}${n.toFixed(2)}%`

// ── 커스텀 툴팁
const DarkTooltip = ({ active, payload, label, formatter }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#16161f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
      <div style={{ color: '#8888aa', marginBottom: 4 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color || '#f0f0f8' }}>
          {formatter ? formatter(p.value, p.name) : `${p.name}: ${fmt(p.value)}`}
        </div>
      ))}
    </div>
  )
}

// ── 메트릭 카드
function MetricCard({ label, value, sub, color, delay = 0 }: {
  label: string; value: string; sub?: string; color?: string; delay?: number
}) {
  return (
    <div className="card" style={{ padding: '20px 24px', animation: `fadeUp 0.5s ease ${delay}ms both` }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, fontFamily: 'var(--font-display)' }}>{label}</div>
      <div style={{ fontSize: 28, fontFamily: 'var(--font-mono)', fontWeight: 500, color: color || 'var(--text-primary)', lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>{sub}</div>}
    </div>
  )
}

// ── 섹션 헤더
function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 20, display: 'flex', alignItems: 'baseline', gap: 12 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h2>
      {sub && <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{sub}</span>}
    </div>
  )
}

// ── 파이차트 커스텀 레이블
const PIE_COLORS = ['#4f8ef7','#f7c94f','#4ff7a0','#f74f6a','#a04ff7','#f7904f','#4ff7f0','#f74fa0','#8ef74f']

// ── 메인
export default function Dashboard() {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null)
  const [allocation, setAllocation] = useState<AllocationData | null>(null)
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'asset' | 'return'>('asset')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [p, a, s] = await Promise.all([
        fetch('/api/portfolio').then(r => r.json()),
        fetch('/api/allocation').then(r => r.json()),
        fetch('/api/summary').then(r => r.json()),
      ])
      setPortfolio(p)
      setAllocation(a)
      setSummary(s)
      setLastUpdated(new Date().toLocaleTimeString('ko-KR'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const todayRate = portfolio
    ? (portfolio.totalTodayChange / (portfolio.totalValue - portfolio.totalTodayChange)) * 100
    : 0

  // 연간/월간 수익률 계산
  const now = new Date()
  const prevYearDec = summary?.monthly.find(m => m.year === now.getFullYear() - 1 && m.month === 12)
  const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth()
  const prevMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
  const prevMonthData = summary?.monthly.find(m => m.year === prevMonthYear && m.month === prevMonth)

  const ytdRate = prevYearDec && portfolio
    ? ((portfolio.totalValue - prevYearDec.asset) / prevYearDec.asset) * 100 : null
  const mtdRate = prevMonthData && portfolio
    ? ((portfolio.totalValue - prevMonthData.asset) / prevMonthData.asset) * 100 : null

  return (
    <div style={{ position: 'relative', minHeight: '100vh', zIndex: 1 }}>
      {/* 배경 오브 */}
      <div className="bg-orb" style={{ width: 600, height: 600, top: -200, left: -100, background: 'radial-gradient(circle, rgba(79,142,247,0.06) 0%, transparent 70%)' }} />
      <div className="bg-orb" style={{ width: 400, height: 400, bottom: 100, right: -100, background: 'radial-gradient(circle, rgba(160,79,247,0.05) 0%, transparent 70%)' }} />

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px', position: 'relative', zIndex: 1 }}>

        {/* ── 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40, animation: 'fadeUp 0.4s ease both' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--accent-blue)', fontFamily: 'var(--font-display)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>PORTFOLIO DASHBOARD</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>
              내 자산 관리
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {lastUpdated && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {lastUpdated} 기준
              </span>
            )}
            <button
              onClick={fetchAll}
              disabled={loading}
              style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-bright)',
                borderRadius: 10, padding: '8px 16px', color: 'var(--text-primary)',
                fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)',
                display: 'flex', alignItems: 'center', gap: 6,
                opacity: loading ? 0.5 : 1, transition: 'all 0.2s'
              }}
            >
              <span style={{ display: 'inline-block', animation: loading ? 'spin-slow 1s linear infinite' : 'none' }}>↻</span>
              새로고침
            </button>
          </div>
        </div>

        {loading && !portfolio ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, animation: 'spin-slow 1s linear infinite', display: 'inline-block', marginBottom: 16 }}>◌</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>데이터 불러오는 중...</div>
            </div>
          </div>
        ) : (
          <>
            {/* ── 상단 메트릭 카드 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 }}>
              <MetricCard
                label="총 평가금액"
                value={`₩${fmtCompact(portfolio?.totalValue || 0)}`}
                sub={`${fmt(portfolio?.totalValue || 0)}원`}
                delay={0}
              />
              <MetricCard
                label="오늘 자산변동"
                value={`${portfolio?.totalTodayChange || 0 >= 0 ? '+' : ''}${fmtCompact(portfolio?.totalTodayChange || 0)}원`}
                sub={fmtPct(todayRate)}
                color={(portfolio?.totalTodayChange || 0) >= 0 ? 'var(--accent-red)' : 'var(--accent-blue)'}
                delay={80}
              />
              <MetricCard
                label="올해 수익률 (YTD)"
                value={ytdRate !== null ? fmtPct(ytdRate) : '—'}
                sub={ytdRate !== null && portfolio ? `+${fmtCompact(portfolio.totalValue - (prevYearDec?.asset || 0))}원` : undefined}
                color={ytdRate !== null && ytdRate >= 0 ? 'var(--accent-red)' : 'var(--accent-blue)'}
                delay={160}
              />
              <MetricCard
                label="이번달 수익률 (MTD)"
                value={mtdRate !== null ? fmtPct(mtdRate) : '—'}
                sub={mtdRate !== null && portfolio ? `+${fmtCompact(portfolio.totalValue - (prevMonthData?.asset || 0))}원` : undefined}
                color={mtdRate !== null && mtdRate >= 0 ? 'var(--accent-red)' : 'var(--accent-blue)'}
                delay={240}
              />
            </div>

            {/* ── 2열 레이아웃: 계좌 비중 + 자산배분 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 16, marginBottom: 16 }}>

              {/* 계좌별 비중 */}
              <div className="card" style={{ padding: 24, animation: 'fadeUp 0.5s ease 300ms both' }}>
                <SectionHeader title="계좌별 자산 비중" />
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={portfolio?.accountSummary || []}
                      dataKey="value"
                      nameKey="account"
                      cx="40%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                    >
                      {(portfolio?.accountSummary || []).map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={<DarkTooltip formatter={(v: number, n: string) => `${n}: ${fmtCompact(v)}원`} />}
                    />
                    <Legend
                      formatter={(value) => <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* 자산배분 현황 */}
              <div className="card" style={{ padding: 24, animation: 'fadeUp 0.5s ease 380ms both' }}>
                <SectionHeader title="자산배분 현황" sub="현재 vs 목표" />
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={allocation?.allocations || []} barSize={20}>
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                    <Tooltip content={<DarkTooltip formatter={(v: number, n: string) => `${n}: ${v.toFixed(2)}%`} />} />
                    <Bar dataKey="current" name="현재" radius={[4,4,0,0]}>
                      {(allocation?.allocations || []).map((a, i) => (
                        <Cell key={i} fill={a.diff > 0 ? 'var(--accent-red)' : 'var(--accent-blue)'} opacity={0.85} />
                      ))}
                    </Bar>
                    {(allocation?.allocations || []).map((a, i) => (
                      <ReferenceLine key={i} y={a.target} stroke="rgba(255,255,255,0.15)" strokeDasharray="3 3" />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ── 종목별 차트 2열 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

              {/* 종목별 평가금액 */}
              <div className="card" style={{ padding: 24, animation: 'fadeUp 0.5s ease 460ms both' }}>
                <SectionHeader title="종목별 평가금액" />
                <ResponsiveContainer width="100%" height={360}>
                  <BarChart
                    data={[...(portfolio?.stockSummary || [])].reverse()}
                    layout="vertical"
                    barSize={14}
                    margin={{ left: 0, right: 60 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      type="category" dataKey="name" width={160}
                      tick={{ fontSize: 11, fill: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}
                      axisLine={false} tickLine={false}
                    />
                    <Tooltip content={<DarkTooltip formatter={(v: number) => `${fmtCompact(v)}원`} />} />
                    <Bar dataKey="value" name="평가금액" radius={[0,4,4,0]} label={{ position: 'right', formatter: (v: number) => fmtCompact(v), fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {(portfolio?.stockSummary || []).map((_, i) => (
                        <Cell key={i} fill={`rgba(79,142,247,${0.9 - i * 0.05})`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* 오늘 자산변동 */}
              <div className="card" style={{ padding: 24, animation: 'fadeUp 0.5s ease 540ms both' }}>
                <SectionHeader title="오늘 자산변동" />
                <ResponsiveContainer width="100%" height={360}>
                  <BarChart
                    data={[...(portfolio?.stockSummary || [])].reverse()}
                    layout="vertical"
                    barSize={14}
                    margin={{ left: 0, right: 20 }}
                  >
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }} tickFormatter={v => fmtCompact(v)} />
                    <YAxis
                      type="category" dataKey="name" width={160}
                      tick={{ fontSize: 11, fill: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}
                      axisLine={false} tickLine={false}
                    />
                    <ReferenceLine x={0} stroke="rgba(255,255,255,0.15)" />
                    <Tooltip content={<DarkTooltip formatter={(v: number) => `${v >= 0 ? '+' : ''}${fmt(v)}원`} />} />
                    <Bar dataKey="todayChange" name="변동" radius={[0,4,4,0]}>
                      {(portfolio?.stockSummary || []).map((s, i) => (
                        <Cell key={i} fill={s.todayChange >= 0 ? 'var(--accent-red)' : 'var(--accent-blue)'} opacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ── 월별 자산 추이 */}
            <div className="card" style={{ padding: 24, marginBottom: 16, animation: 'fadeUp 0.5s ease 620ms both' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <SectionHeader title="월별 자산 추이" />
                <div style={{ display: 'flex', gap: 4, background: 'var(--bg)', borderRadius: 8, padding: 3 }}>
                  {(['asset', 'return'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      style={{
                        padding: '6px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                        fontFamily: 'var(--font-display)', fontWeight: 600, border: 'none',
                        background: activeTab === tab ? 'var(--bg-card-hover)' : 'transparent',
                        color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
                        transition: 'all 0.2s'
                      }}
                    >
                      {tab === 'asset' ? '자산 추이' : '월별 수익률'}
                    </button>
                  ))}
                </div>
              </div>

              {activeTab === 'asset' ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={summary?.monthly || []} margin={{ left: 20, right: 20 }}>
                    <defs>
                      <linearGradient id="assetGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f8ef7" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#4f8ef7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} interval={1} angle={-30} textAnchor="end" height={40} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} tickFormatter={v => fmtCompact(v)} />
                    <Tooltip content={<DarkTooltip formatter={(v: number) => `₩${fmt(v)}원`} />} />
                    <Area type="monotone" dataKey="asset" name="자산" stroke="#4f8ef7" strokeWidth={2} fill="url(#assetGrad)" dot={{ fill: '#4f8ef7', r: 3 }} activeDot={{ r: 5 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={summary?.monthly || []} margin={{ left: 20, right: 20 }}>
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} interval={1} angle={-30} textAnchor="end" height={40} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                    <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
                    <Tooltip content={<DarkTooltip formatter={(v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`} />} />
                    <Bar dataKey="rate" name="수익률" radius={[4,4,0,0]}>
                      {(summary?.monthly || []).map((m, i) => (
                        <Cell key={i} fill={m.rate >= 0 ? 'var(--accent-red)' : 'var(--accent-blue)'} opacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* ── 계좌별 상세 */}
            <div className="card" style={{ padding: 24, animation: 'fadeUp 0.5s ease 700ms both' }}>
              <SectionHeader title="계좌별 상세 현황" />
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['계좌', '평가금액', '오늘 변동', '변동률', '종목 수'].map(h => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(portfolio?.accountSummary || []).map((a, i) => {
                      const rate = (a.todayChange / (a.value - a.todayChange)) * 100
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>{a.account}</td>
                          <td style={{ padding: '12px 16px', color: 'var(--text-primary)' }}>{fmt(a.value)}원</td>
                          <td style={{ padding: '12px 16px', color: a.todayChange >= 0 ? 'var(--accent-red)' : 'var(--accent-blue)' }}>
                            {a.todayChange >= 0 ? '+' : ''}{fmt(a.todayChange)}원
                          </td>
                          <td style={{ padding: '12px 16px', color: rate >= 0 ? 'var(--accent-red)' : 'var(--accent-blue)' }}>
                            {fmtPct(rate)}
                          </td>
                          <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{a.count}개</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </>
        )}

        {/* 푸터 */}
        <div style={{ textAlign: 'center', marginTop: 48, paddingBottom: 32, color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
          구글 시트 GOOGLEFINANCE 기준 · 최대 15분 지연
        </div>
      </div>
    </div>
  )
}
