
// YouTube API Error types
export class QuotaExceededError extends Error {
    constructor(quotaType: string) {
      super(`YouTube API quota exceeded: ${quotaType}`);
      this.name = 'QuotaExceededError';
    }
  }
  
  export class RateLimitError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'RateLimitError';
    }
  }