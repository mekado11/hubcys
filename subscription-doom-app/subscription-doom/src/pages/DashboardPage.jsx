import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateMockTransactions } from '../utils/mockTransactions'
import { analyzeTransactions } from '../utils/analyzer'
import { futureValue, formatCurrency } from '../utils/calculator'

// ── Helpers ──────────────────────────────────────────────────────

function fmt(n) {
  return '$' + Math.round(n).toLocaleString()
}

function fmtCompact(n) {
  if (n >= 1000) return '$' + Math.round(n / 1000) + 'k'
  return '$' + Math.round(n)
}

// ── Sub-components ───────────────────────────────────────────────

function TopHero({ summary }) {
  return (
    <div className="bg-gradient-to-b from-[#1E1408] to-doom-bg border-b border-doom-border px-6 py-8 text-center">
      <div className="flex items-center justify-center gap-2 mb-1">
        <h1 className="text-doom-text text-4xl font-bold tracking-tight">
          {fmt(summary.totalMonthly)}
        </h1>
        <span className="text-doom-amber text-lg font-semibold">/ month</span>
        <span className="text-xl">💸</span>
      </div>
      <p className="text-doom-muted text-sm mb-1">Quietly leaving your life</p>
      <p className="text-doom-muted text-base">
        <span className="text-doom-gold font-semibold">{fmt(summary.totalYearly)}</span>
        {' '}/ year
      </p>
    </div>
  )
}

function SectionHeader({ title, subtitle, onMore }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-doom-text font-bold text-base">{title}</h2>
        {subtitle && <p className="text-doom-muted text-xs mt-0.5">{subtitle}</p>}
      </div>
      {onMore && (
        <button onClick={onMore} className="text-doom-muted text-xl leading-none">···</button>
      )}
    </div>
  )
}

function LeakCard({ item, rank }) {
  const fv10 = futureValue(item.monthlyAvg, 10)
  return (
    <div className="bg-doom-card border border-doom-border rounded-2xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
          style={{ backgroundColor: item.color + '22', border: `1px solid ${item.color}44` }}
        >
          {item.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-doom-text font-semibold text-sm truncate">
            {item.label ?? item.merchant}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-doom-text font-bold text-sm">
            <span className="text-doom-amber">{fmt(item.monthlyAvg)}</span>
            <span className="text-doom-muted text-xs">/mo</span>
          </p>
          <p className="text-doom-muted text-xs">– {fmtCompact(item.yearlyTotal)}/yr</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-doom-green text-xs">
        <span>→</span>
        <span className="font-semibold">{fmtCompact(fv10)}</span>
        <span className="text-doom-muted">if invested over 10 years</span>
      </div>
    </div>
  )
}

function SubscriptionRow({ sub }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-doom-border last:border-0">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
        style={{ backgroundColor: sub.color + '22' }}
      >
        {sub.emoji}
      </div>
      <span className="text-doom-text text-sm flex-1">{sub.merchant}</span>
      <div className="text-right">
        <span className="text-doom-text font-semibold text-sm">{fmt(sub.monthlyAvg)}</span>
        <span className="text-doom-muted text-xs">/mo</span>
      </div>
    </div>
  )
}

function HabitBar({ habit, maxAmount }) {
  const pct = Math.round((habit.monthlyAvg / maxAmount) * 100)
  return (
    <div className="py-3 border-b border-doom-border last:border-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">{habit.emoji}</span>
          <span className="text-doom-text text-sm">{habit.label}</span>
        </div>
        <span className="text-doom-amber font-bold text-sm">{fmt(habit.monthlyAvg)}/mo</span>
      </div>
      <div className="h-1.5 bg-doom-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: habit.color }}
        />
      </div>
    </div>
  )
}

function WhatIfRow({ habit, enabled, onToggle }) {
  const saved5yr = futureValue(habit.monthlyAvg, 5)
  const saved10yr = futureValue(habit.monthlyAvg, 10)

  return (
    <div className="py-3 border-b border-doom-border last:border-0">
      <div className="flex items-center gap-3">
        {/* Toggle */}
        <button
          onClick={() => onToggle(habit.category)}
          className={`w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${
            enabled
              ? 'bg-doom-amber border-doom-amber'
              : 'bg-transparent border-doom-muted'
          }`}
        >
          {enabled && (
            <svg className="w-3 h-3 text-doom-bg" fill="none" viewBox="0 0 12 12">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-doom-text text-sm">{habit.label}</span>
            <span className="text-doom-muted text-xs">{fmt(habit.monthlyAvg)}/mo</span>
          </div>
          {enabled && (
            <div className="flex gap-3 mt-1">
              <span className="text-doom-green text-xs">
                → <strong>{fmtCompact(saved5yr)}</strong> in 5yr
              </span>
              <span className="text-doom-green text-xs">
                → <strong>{fmtCompact(saved10yr)}</strong> in 10yr
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function WhatIfSummary({ habits, enabled }) {
  const activeHabits = habits.filter(h => enabled.has(h.category))
  const monthlyTotal = activeHabits.reduce((s, h) => s + h.monthlyAvg, 0)
  const yearlyTotal = monthlyTotal * 12
  const fv10 = futureValue(monthlyTotal, 10)

  if (activeHabits.length === 0) return null

  return (
    <div className="mt-4 bg-[#0A1F10] border border-[#1A4D2A] rounded-2xl p-4">
      <p className="text-doom-green font-semibold text-sm mb-1">
        You'd keep {fmt(monthlyTotal)}/month
      </p>
      <p className="text-doom-green text-sm mb-2">
        → {fmt(yearlyTotal)}/year saved
      </p>
      <p className="text-doom-text font-bold text-base">
        → {fmtCompact(fv10)}
        <span className="text-doom-muted font-normal text-sm"> invested over 10 years at 7%</span>
      </p>
    </div>
  )
}

// ── Main Dashboard ───────────────────────────────────────────────

export default function DashboardPage() {
  const navigate = useNavigate()

  const analysis = useMemo(() => {
    const txns = generateMockTransactions()
    return analyzeTransactions(txns)
  }, [])

  const { subscriptions, habits, topLeaks, summary } = analysis

  const [enabledHabits, setEnabledHabits] = useState(
    new Set(habits.map(h => h.category))
  )

  function toggleHabit(category) {
    setEnabledHabits(prev => {
      const next = new Set(prev)
      if (next.has(category)) next.delete(category)
      else next.add(category)
      return next
    })
  }

  const maxHabitAmount = Math.max(...habits.map(h => h.monthlyAvg), 1)

  return (
    <div className="min-h-screen bg-doom-bg">
      {/* Header bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-doom-border">
        <button
          onClick={() => navigate('/')}
          className="text-doom-muted text-sm flex items-center gap-1"
        >
          ← Back
        </button>
        <span className="flex items-center gap-2 text-doom-text font-bold text-base">
          <span>💸</span> Subscription Doom
        </span>
        <button className="text-doom-muted text-xl">⚙️</button>
      </header>

      {/* Hero total */}
      <TopHero summary={summary} />

      <div className="px-4 py-6 max-w-lg mx-auto space-y-8">

        {/* ── TOP LEAKS ─────────────────────────────── */}
        <section>
          <SectionHeader title="Your Top Leaks" onMore={() => {}} />
          <div className="space-y-3">
            {topLeaks.map((item, i) => (
              <LeakCard key={item.merchant ?? item.category} item={item} rank={i + 1} />
            ))}
          </div>
        </section>

        {/* ── SUBSCRIPTIONS ─────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-doom-text font-bold text-base">Subscriptions</h2>
            <span className="text-doom-muted text-xs">
              {fmt(summary.subMonthly)}/mo total
            </span>
          </div>
          <p className="text-doom-muted text-xs mb-4">
            {formatCurrency(summary.subMonthly * 12)} quietly leaving every year
          </p>
          <div className="bg-doom-card border border-doom-border rounded-2xl px-4 divide-y divide-doom-border">
            {subscriptions.map(sub => (
              <SubscriptionRow key={sub.merchant} sub={sub} />
            ))}
          </div>
        </section>

        {/* ── HABITS ────────────────────────────────── */}
        <section>
          <SectionHeader
            title="Habits"
            subtitle="This is where it adds up"
            onMore={() => {}}
          />
          <div className="bg-doom-card border border-doom-border rounded-2xl px-4">
            {habits.map(habit => (
              <HabitBar
                key={habit.category}
                habit={habit}
                maxAmount={maxHabitAmount}
              />
            ))}
          </div>
        </section>

        {/* ── INVESTMENT IMPACT ─────────────────────── */}
        <section>
          <div className="mb-4">
            <h2 className="text-doom-text font-bold text-base">Investment Impact</h2>
            <p className="text-doom-muted text-xs mt-0.5">If this money worked for you instead</p>
          </div>
          <div className="space-y-3">
            {habits.slice(0, 4).map(habit => {
              const fv10 = futureValue(habit.monthlyAvg, 10)
              return (
                <div
                  key={habit.category}
                  className="bg-doom-card border border-doom-border rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span>{habit.emoji}</span>
                      <span className="text-doom-text text-sm font-semibold">{habit.label}</span>
                    </div>
                    <span className="text-doom-muted text-xs">{fmt(habit.monthlyAvg)}/mo</span>
                  </div>
                  <div className="text-doom-muted text-xs mb-2">
                    {fmt(habit.yearlyTotal)}/yr
                  </div>
                  <div className="flex items-center gap-2 text-doom-green text-sm">
                    <span>If invested at 7% for 10 years:</span>
                  </div>
                  <p className="text-doom-green font-bold text-xl mt-1">
                    → {fmtCompact(fv10)}
                  </p>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── WHAT IF TOGGLE ────────────────────────── */}
        <section>
          <div className="mb-4">
            <h2 className="text-doom-text font-bold text-base">What If</h2>
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-doom-muted text-xs">Toggle habits to see your savings</p>
              <span className="text-doom-muted text-xs">
                You keep{' '}
                <span className="text-doom-gold font-semibold">
                  {fmt(habits.filter(h => enabledHabits.has(h.category)).reduce((s, h) => s + h.monthlyAvg, 0))}
                </span>
                /month
              </span>
            </div>
          </div>
          <div className="bg-doom-card border border-doom-border rounded-2xl px-4">
            {habits.map(habit => (
              <WhatIfRow
                key={habit.category}
                habit={habit}
                enabled={enabledHabits.has(habit.category)}
                onToggle={toggleHabit}
              />
            ))}
          </div>
          <WhatIfSummary habits={habits} enabled={enabledHabits} />
        </section>

        {/* ── FOOTER CTA ────────────────────────────── */}
        <div className="bg-doom-card border border-doom-border rounded-2xl p-5 text-center">
          <p className="text-doom-muted text-xs mb-2">Want alerts when spending spikes?</p>
          <h3 className="text-doom-text font-bold text-lg mb-1">
            Upgrade to Doom Pro
          </h3>
          <p className="text-doom-muted text-sm mb-4">
            Real-time alerts · Export reports · Deep insights · 12-month history
          </p>
          <button className="w-full bg-doom-amber text-doom-bg font-bold py-3.5 rounded-xl text-sm">
            Start Free Trial
          </button>
          <p className="text-doom-muted text-xs mt-3">Cancel anytime. No doom surprises.</p>
        </div>

        <div className="h-8" />
      </div>
    </div>
  )
}
