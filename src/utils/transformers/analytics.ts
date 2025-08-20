export interface ColumnHeader {
  name: string;
  columnType: string;
  dataType: string;
}

export interface ParsedAnalytics {
  columnHeaders: ColumnHeader[];
  rows: any[][];
  kind?: string;
}

export interface MetricTotals {
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  subscribersGained?: number;
  subscribersLost?: number;
  estimatedMinutesWatched?: number;
}

export interface ColumnData {
  [columnName: string]: any[];
}

export function parseAnalyticsResponse(data: any): ParsedAnalytics {
  return {
    columnHeaders: data.columnHeaders || [],
    rows: data.rows || [],
    kind: data.kind
  };
}

export function calculateMetricTotals(rows: any[][], columnHeaders: ColumnHeader[]): MetricTotals {
  if (!rows || rows.length === 0 || !columnHeaders) {
    return {};
  }

  const totals: MetricTotals = {};
  
  columnHeaders.forEach((header, index) => {
    const metricName = header.name;
    const total = rows.reduce((sum, row) => sum + (parseInt(row[index]) || 0), 0);
    
    switch (metricName) {
      case 'views':
        totals.views = total;
        break;
      case 'likes':
        totals.likes = total;
        break;
      case 'comments':
        totals.comments = total;
        break;
      case 'shares':
        totals.shares = total;
        break;
      case 'subscribersGained':
        totals.subscribersGained = total;
        break;
      case 'subscribersLost':
        totals.subscribersLost = total;
        break;
      case 'estimatedMinutesWatched':
        totals.estimatedMinutesWatched = total;
        break;
    }
  });

  return totals;
}

export function extractColumnValues(rows: any[][], columnHeaders: ColumnHeader[]): ColumnData {
  const columnData: ColumnData = {};
  
  columnHeaders.forEach((header, index) => {
    columnData[header.name] = rows.map(row => row[index]);
  });
  
  return columnData;
}

export function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / oldValue) * 100;
}