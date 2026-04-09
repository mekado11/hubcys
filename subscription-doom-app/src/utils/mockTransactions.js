// 6 months of realistic demo transactions
// Spread across Jan–Jun (approx current year)

const now = new Date()
const months = Array.from({ length: 6 }, (_, i) => {
  const d = new Date(now)
  d.setMonth(d.getMonth() - i)
  return d
})

function dateInMonth(monthDate, day) {
  return new Date(monthDate.getFullYear(), monthDate.getMonth(), day)
    .toISOString()
    .split('T')[0]
}

function jitter(base, pct = 0.05) {
  return +(base * (1 + (Math.random() - 0.5) * 2 * pct)).toFixed(2)
}

export function generateMockTransactions() {
  const txns = []
  let id = 1

  // ── SUBSCRIPTIONS ──────────────────────────────────────────────
  const subscriptions = [
    { merchant: 'Netflix', category: 'Entertainment', amount: 15.49 },
    { merchant: 'Spotify', category: 'Entertainment', amount: 10.99 },
    { merchant: 'Adobe Creative Cloud', category: 'Software', amount: 59.99 },
    { merchant: 'Gym & Fitness', category: 'Health & Fitness', amount: 40.00 },
    { merchant: 'iCloud Storage', category: 'Software', amount: 2.99 },
    { merchant: 'YouTube Premium', category: 'Entertainment', amount: 13.99 },
  ]

  for (const sub of subscriptions) {
    for (const m of months) {
      txns.push({
        id: id++,
        merchant: sub.merchant,
        category: sub.category,
        amount: jitter(sub.amount, 0), // subscriptions are fixed
        date: dateInMonth(m, 1 + Math.floor(Math.random() * 5)),
        type: 'subscription',
      })
    }
  }

  // ── HABITS: Coffee ─────────────────────────────────────────────
  const coffeeShops = ['Starbucks', 'Blue Bottle Coffee', 'Dunkin', 'Local Cafe']
  for (const m of months) {
    for (let i = 0; i < 18; i++) {
      txns.push({
        id: id++,
        merchant: coffeeShops[i % coffeeShops.length],
        category: 'Coffee Shops',
        amount: jitter(6.5, 0.25),
        date: dateInMonth(m, 1 + Math.floor(Math.random() * 28)),
        type: 'habit',
      })
    }
  }

  // ── HABITS: Eating Out ─────────────────────────────────────────
  const restaurants = [
    'Chipotle', 'Shake Shack', 'Local Sushi', 'Pizza Place',
    'Thai Kitchen', 'Burger Bar', 'Taco Bell', 'Five Guys',
  ]
  for (const m of months) {
    for (let i = 0; i < 16; i++) {
      txns.push({
        id: id++,
        merchant: restaurants[i % restaurants.length],
        category: 'Restaurants',
        amount: jitter(28, 0.4),
        date: dateInMonth(m, 1 + Math.floor(Math.random() * 28)),
        type: 'habit',
      })
    }
  }

  // ── HABITS: Alcohol / Bars ─────────────────────────────────────
  const bars = ['The Local Bar', 'Drizly Delivery', 'Total Wine', 'Craft Beer Co', 'Bar Tab']
  for (const m of months) {
    for (let i = 0; i < 7; i++) {
      txns.push({
        id: id++,
        merchant: bars[i % bars.length],
        category: 'Bars & Alcohol',
        amount: jitter(24, 0.4),
        date: dateInMonth(m, 1 + Math.floor(Math.random() * 28)),
        type: 'habit',
      })
    }
  }

  // ── HABITS: Food Delivery ──────────────────────────────────────
  const delivery = ['DoorDash', 'Uber Eats', 'Grubhub', 'Instacart']
  for (const m of months) {
    for (let i = 0; i < 8; i++) {
      txns.push({
        id: id++,
        merchant: delivery[i % delivery.length],
        category: 'Food Delivery',
        amount: jitter(38, 0.3),
        date: dateInMonth(m, 1 + Math.floor(Math.random() * 28)),
        type: 'habit',
      })
    }
  }

  // ── HABITS: Rideshare ──────────────────────────────────────────
  const rides = ['Uber', 'Lyft']
  for (const m of months) {
    for (let i = 0; i < 6; i++) {
      txns.push({
        id: id++,
        merchant: rides[i % rides.length],
        category: 'Rideshare',
        amount: jitter(22, 0.5),
        date: dateInMonth(m, 1 + Math.floor(Math.random() * 28)),
        type: 'habit',
      })
    }
  }

  // ── HABITS: Shopping ──────────────────────────────────────────
  const shopping = ['Amazon', 'Target', 'Zara', 'ASOS', 'Nike Store']
  for (const m of months) {
    for (let i = 0; i < 9; i++) {
      txns.push({
        id: id++,
        merchant: shopping[i % shopping.length],
        category: 'Shopping',
        amount: jitter(52, 0.6),
        date: dateInMonth(m, 1 + Math.floor(Math.random() * 28)),
        type: 'habit',
      })
    }
  }

  // ── OTHER ──────────────────────────────────────────────────────
  const other = [
    { merchant: 'Electric Bill', category: 'Utilities', amount: 95 },
    { merchant: 'Internet Provider', category: 'Utilities', amount: 70 },
    { merchant: 'Rent/Mortgage', category: 'Housing', amount: 1800 },
    { merchant: 'Gas Station', category: 'Gas', amount: 55 },
    { merchant: 'CVS Pharmacy', category: 'Health', amount: 32 },
    { merchant: 'Whole Foods', category: 'Groceries', amount: 140 },
  ]

  for (const o of other) {
    for (const m of months) {
      txns.push({
        id: id++,
        merchant: o.merchant,
        category: o.category,
        amount: jitter(o.amount, 0.1),
        date: dateInMonth(m, 1 + Math.floor(Math.random() * 25)),
        type: 'other',
      })
    }
  }

  return txns
}
