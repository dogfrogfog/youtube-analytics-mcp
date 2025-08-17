## Phase 1: Channel Health Check (Start Here Always)

*"How is my channel doing overall?"*

These operations give you the 10,000-foot view. Always start here to understand if you have a problem before diving deeper.

### Core Vitals Operations

### `getChannelOverview`

**Purpose:** Your channel's vital signs - like checking pulse and blood pressure

**Key Metrics:** Views, watch time, subscriber change

**Red Flags:** Sudden drops, flatlined growth, negative subscriber trends

```jsx
async function getChannelOverview({ startDate, endDate }) {
  const response = await youtube.reports.query({
    ids: 'channel==MINE',
    metrics: 'views,estimatedMinutesWatched,averageViewDuration,subscribersGained,subscribersLost',
    dimensions: 'day',
    startDate, endDate,
    sort: 'day'
  });
  return response.data;
}

```

### `getComparisonMetrics`

**Purpose:** Are you growing or declining? Compare month-over-month

**Key Insights:** Growth rate, seasonal patterns, trend direction

**Action Triggers:** >20% decline = urgent investigation needed

```jsx
async function getComparisonMetrics({ metrics, period1Start, period1End, period2Start, period2End }) {
  // Compare this month vs last month to identify trends
  const [period1, period2] = await Promise.all([
    youtube.reports.query({
      ids: 'channel==MINE',
      metrics: metrics,
      startDate: period1Start,
      endDate: period1End
    }),
    youtube.reports.query({
      ids: 'channel==MINE',
      metrics: metrics,
      startDate: period2Start,
      endDate: period2End
    })
  ]);
  return { period1, period2, changePercent: calculateChange(period1, period2) };
}

```