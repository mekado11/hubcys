import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const BANKS = [
  { name: 'Chase', color: '#117ACA', initial: 'C' },
  { name: 'Bank of America', color: '#E31837', initial: 'B' },
  { name: 'Wells Fargo', color: '#D71E2B', initial: 'W' },
  { name: 'Citi', color: '#0066CC', initial: 'C' },
  { name: 'Capital One', color: '#C41230', initial: 'C' },
  { name: 'American Express', color: '#2E77BC', initial: 'A' },
]

const LEAKS = [
  { label: 'Netflix', amount: '$15/mo', color: '#E50914' },
  { label: 'Coffee runs', amount: '$120/mo', color: '#C4831A' },
  { label: 'Eating out', amount: '$480/mo', color: '#E05252' },
]

function AnimatedCounter({ value, prefix = '$' }) {
  return (
    <span>
      {prefix}{value.toLocaleString()}
    </span>
  )
}

export default function ConnectPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState('landing') // 'landing' | 'connecting' | 'scanning'
  const [progress, setProgress] = useState(0)
  const [scanLabel, setScanLabel] = useState('Reading transactions...')

  const SCAN_STEPS = [
    'Reading transactions...',
    'Detecting subscriptions...',
    'Analyzing spending habits...',
    'Calculating your leaks...',
    'Building your dashboard...',
  ]

  function handleDemoConnect() {
    setStep('connecting')

    setTimeout(() => {
      setStep('scanning')
      let stepIdx = 0

      const interval = setInterval(() => {
        stepIdx++
        setProgress(Math.min((stepIdx / SCAN_STEPS.length) * 100, 95))
        setScanLabel(SCAN_STEPS[Math.min(stepIdx, SCAN_STEPS.length - 1)])

        if (stepIdx >= SCAN_STEPS.length) {
          clearInterval(interval)
          setProgress(100)
          setTimeout(() => navigate('/dashboard'), 400)
        }
      }, 600)
    }, 800)
  }

  if (step === 'connecting') {
    return (
      <div className="min-h-screen bg-doom-bg flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-doom-amber flex items-center justify-center mx-auto mb-6 animate-pulse">
            <span className="text-2xl">🏦</span>
          </div>
          <p className="text-doom-text text-lg font-semibold">Connecting securely...</p>
          <p className="text-doom-muted text-sm mt-2">Bank-level 256-bit encryption</p>
        </div>
      </div>
    )
  }

  if (step === 'scanning') {
    return (
      <div className="min-h-screen bg-doom-bg flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <div className="text-4xl mb-6">🔍</div>
          <h2 className="text-doom-text text-xl font-bold mb-2">Scanning your accounts</h2>
          <p className="text-doom-muted text-sm mb-8">6 months of transactions</p>

          {/* Progress bar */}
          <div className="h-1.5 bg-doom-border rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-doom-amber rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="text-doom-muted text-sm">{scanLabel}</p>

          {/* Animated leak previews */}
          <div className="mt-10 space-y-3">
            {LEAKS.slice(0, Math.ceil((progress / 100) * LEAKS.length)).map((leak) => (
              <div
                key={leak.label}
                className="flex items-center justify-between bg-doom-card border border-doom-border rounded-xl px-4 py-3 text-left animate-[fadeIn_0.4s_ease]"
              >
                <span className="text-doom-text text-sm">{leak.label}</span>
                <span className="text-doom-amber font-semibold text-sm">{leak.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Landing page
  return (
    <div className="min-h-screen bg-doom-bg flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <span className="text-xl">💸</span>
          <span className="text-doom-text font-bold text-lg tracking-tight">Subscription Doom</span>
        </div>
        <span className="text-xs text-doom-muted bg-doom-card border border-doom-border px-3 py-1 rounded-full">
          Demo Mode
        </span>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-10 text-center">
        {/* Big number teaser */}
        <div className="mb-8 bg-doom-card border border-doom-border rounded-3xl px-8 py-6 max-w-xs w-full">
          <p className="text-doom-muted text-sm mb-1">Average person leaks</p>
          <p className="text-doom-amber text-5xl font-bold tracking-tight">
            <AnimatedCounter value={25680} />
          </p>
          <p className="text-doom-muted text-sm mt-1">per year without noticing</p>
        </div>

        {/* Headline */}
        <h1 className="text-doom-text text-3xl font-bold leading-tight mb-3 max-w-xs">
          See exactly where your money disappears
        </h1>
        <p className="text-doom-muted text-base max-w-xs leading-relaxed mb-10">
          We scan your last 6 months and show you every subscription, habit, and money leak — in 60 seconds.
        </p>

        {/* CTA */}
        <button
          onClick={handleDemoConnect}
          className="w-full max-w-xs bg-doom-amber text-doom-bg font-bold text-base py-4 rounded-2xl mb-4 active:scale-95 transition-transform"
        >
          Connect Your Bank
        </button>

        <button
          onClick={handleDemoConnect}
          className="w-full max-w-xs bg-doom-card border border-doom-border text-doom-text font-semibold text-base py-4 rounded-2xl active:scale-95 transition-transform"
        >
          Try with Demo Data
        </button>

        <p className="text-doom-muted text-xs mt-5 max-w-xs">
          Secured by Plaid. Read-only access. We never store your credentials.
        </p>

        {/* Trust badges */}
        <div className="flex items-center gap-6 mt-8">
          {['🔒 Bank-grade security', '👁️ Read-only', '🚫 No sharing'].map(b => (
            <span key={b} className="text-doom-muted text-xs">{b}</span>
          ))}
        </div>
      </main>

      {/* Bank logos strip */}
      <div className="px-6 pb-8">
        <p className="text-doom-muted text-xs text-center mb-4">Works with 10,000+ banks</p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {BANKS.map(bank => (
            <div
              key={bank.name}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: bank.color }}
              title={bank.name}
            >
              {bank.initial}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
