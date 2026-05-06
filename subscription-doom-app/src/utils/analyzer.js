// Core transaction analysis logic

const SUBSCRIPTION_MERCHANTS = new Set([
  'netflix', 'spotify', 'adobe', 'hulu', 'disney', 'apple', 'icloud',
  'amazon prime', 'youtube premium', 'gym', 'fitness', 'crunchfit',
  'peloton', 'duolingo', 'notion', 'slack', 'dropbox', 'microsoft',
  'google one', 'linkedin premium', 'paramount', 'hbo', 'peacock',
])

const HABIT_CATEGORIES = new Set([
  'Coffee Shops',
  'Restaurants',
  'Bars & Alcohol',
  'Food Delivery',
  'Rideshare',
  'Shopping',
])

const CATEGORY_META = {
  'Coffee Shops':  { label: 'Coffee',        emoji: '☕', color: '#C4831A' },
  'Restaurants':   { label: 'Eating Out',     emoji: '🍔', color: '#E05252' },
  'Bars & Alcohol':{ label: 'Alcohol',        emoji: '🍷', color: '#9B4DCA' },
  'Food Delivery': { label: 'Food Delivery',  emoji: '🛵', color: '#F5A623' },
  'Rideshare':     { label: 'Rideshare',      emoji: '🚗', color: '#4A90D9' },
  'Shopping':      { label: 'Shopping',       emoji: '🛍️', color: '#4CAF7D' },
}

const SUB_META = {
  'Netflix':              { emoji: '🎬', color: '#E50914' },
  'Spotify':              { emoji: '🎵', color: '#1DB954' },
  'Adobe Creative Cloud': { emoji: '🎨', color: '#FF0000' },
  'Gym & Fitness':        { emoji: '💪', color: '#F5A623' },
  'iCloud Storage':       { emoji: '☁️', color: '#4A90D9' },
  'YouTube Premium':      { emoji: '▶️', color: '#FF0000' },
}

/**
 * Detect if a merchant is subscription-like by name OR by
 * recurring pattern (same merchant, same amount ±10%, monthly interval).
 */
function detectSubscriptions(transactions) {
  const byMerchant = {}

  for (const t of transactions) {
    const key = t.merchant.toLowerCase()
    if (!byMerchant[key]) byMerchant[key] = []
    byMerchant[key].push(t)
  }

  const subscriptions = []

  for (const [key, txns] of Object.entries(byMerchant)) {
    // Sort by date
    txns.sort((a, b) => new Date(a.date) - new Date(b.date))

    const isNamedSub = [...SUBSCRIPTION_MERCHANTS].some(s => key.includes(s))
    const amounts = txns.map(t => t.amount)
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length
    const allSimilarAmount = amounts.every(a => Math.abs(a - avgAmount) / avgAmount < 0.1)

    // Check monthly interval
    let isRecurring = false
    if (txns.length >= 2) {
      const gaps = []
      for (let i = 1; i < txns.length; i++) {
        const days = (new Date(txns[i].date) - new Date(txns[i - 1].date)) / (1000 * 60 * 60 * 24)
        gaps.push(days)
      }
      const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length
      isRecurring = avgGap >= 25 && avgGap <= 35
    }

    if (isNamedSub || (allSimilarAmount && isRecurring)) {
      const merchant = txns[0].merchant
      subscriptions.push({
        merchant,
        emoji: SUB_META[merchant]?.emoji ?? '📦',
        color: SUB_META[merchant]?.color ?? '#8A7D68',
        monthlyAvg: +avgAmount.toFixed(2),
        yearlyTotal: +(avgAmount * 12).toFixed(2),
        txnCount: txns.length,
        type: 'subscription',
      })
    }
  }

  return subscriptions.sort((a, b) => b.monthlyAvg - a.monthlyAvg)
}

/**
 * Detect habit spending: categories with high frequency or total.
 */
function detectHabits(transactions) {
  const byCategory = {}

  for (const t of transactions) {
    if (!HABIT_CATEGORIES.has(t.category)) continue
    if (!byCategory[t.category]) byCategory[t.category] = []
    byCategory[t.category].push(t)
  }

  const habits = []

  for (const [category, txns] of Object.entries(byCategory)) {
    const totalSpend = txns.reduce((s, t) => s + t.amount, 0)
    const monthCount = 6 // we pull 6 months
    const monthlyAvg = totalSpend / monthCount
    const meta = CATEGORY_META[category]

    habits.push({
      category,
      label: meta?.label ?? category,
      emoji: meta?.emoji ?? '💸',
      color: meta?.color ?? '#8A7D68',
      monthlyAvg: +monthlyAvg.toFixed(2),
      yearlyTotal: +(monthlyAvg * 12).toFixed(2),
      txnCount: txns.length,
      monthlyTxnCount: +(txns.length / monthCount).toFixed(1),
      type: 'habit',
    })
  }

  return habits.sort((a, b) => b.monthlyAvg - a.monthlyAvg)
}

/**
 * Full analysis result from a transaction list.
 */
export function analyzeTransactions(transactions) {
  const subscriptions = detectSubscriptions(
    transactions.filter(t => t.type === 'subscription')
  )
  const habits = detectHabits(transactions)

  const subMonthly = subscriptions.reduce((s, x) => s + x.monthlyAvg, 0)
  const habitMonthly = habits.reduce((s, x) => s + x.monthlyAvg, 0)
  const totalMonthly = subMonthly + habitMonthly

  // Top leaks = all items sorted by monthly spend
  const allItems = [...subscriptions, ...habits]
  const topLeaks = [...allItems].sort((a, b) => b.monthlyAvg - a.monthlyAvg).slice(0, 3)

  return {
    subscriptions,
    habits,
    topLeaks,
    summary: {
      totalMonthly: +totalMonthly.toFixed(2),
      totalYearly: +(totalMonthly * 12).toFixed(2),
      subMonthly: +subMonthly.toFixed(2),
      habitMonthly: +habitMonthly.toFixed(2),
    },
  }
}
