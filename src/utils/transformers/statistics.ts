export interface EngagementRates {
  likeRate: number;
  commentRate: number;
  shareRate: number;
}

export interface RetentionMetrics {
  averageRetention: number;
  startRetention: number;
  endRetention: number;
  totalDrop: number;
}

export interface RetentionPoint {
  timePercent: number;
  retentionPercent: number;
}

export function calculateEngagementRates(totalViews: number, totalLikes: number, totalComments: number, totalShares: number): EngagementRates {
  if (totalViews === 0) {
    return { likeRate: 0, commentRate: 0, shareRate: 0 };
  }

  return {
    likeRate: (totalLikes / totalViews) * 100,
    commentRate: (totalComments / totalViews) * 100,
    shareRate: (totalShares / totalViews) * 100
  };
}

export function calculateRetentionMetrics(retentionData: RetentionPoint[]): RetentionMetrics {
  if (!retentionData || retentionData.length === 0) {
    return { averageRetention: 0, startRetention: 0, endRetention: 0, totalDrop: 0 };
  }

  const startRetention = retentionData[0]?.retentionPercent || 0;
  const endRetention = retentionData[retentionData.length - 1]?.retentionPercent || 0;
  const averageRetention = retentionData.reduce((sum, point) => sum + point.retentionPercent, 0) / retentionData.length;
  const totalDrop = startRetention - endRetention;

  return {
    averageRetention,
    startRetention,
    endRetention,
    totalDrop
  };
}

export function parseRetentionData(rows: any[][]): RetentionPoint[] {
  return rows.map(row => ({
    timePercent: (row[0] || 0) * 100,
    retentionPercent: (row[1] || 0) * 100
  }));
}

export function formatNumber(num: number): string {
  return num.toLocaleString();
}

export function formatPercentage(num: number, decimals: number = 1): string {
  return num.toFixed(decimals) + '%';
}