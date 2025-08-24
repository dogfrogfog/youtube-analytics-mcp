import { authTools } from './auth/tool-configs.js';
import { serverInfoTools } from './server/info-configs.js';
import { audienceTools } from './youtube/tools/audience-configs.js';
import { channelTools } from './youtube/tools/channel-configs.js';
import { competitorTools } from './youtube/tools/competitor-configs.js';
import { discoveryTools } from './youtube/tools/discovery-configs.js';
import { engagementTools } from './youtube/tools/engagement-configs.js';
import { healthTools } from './youtube/tools/health-configs.js';
import { performanceTools } from './youtube/tools/performance-configs.js';
import { trendsTools } from './youtube/tools/trends-configs.js';

export const allTools = [
  ...authTools,
  ...serverInfoTools,
  ...channelTools,
  ...healthTools,
  ...audienceTools,
  ...discoveryTools,
  ...performanceTools,
  ...engagementTools,
  ...trendsTools,
  ...competitorTools,
];

