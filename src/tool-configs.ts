import { authToolConfigs } from './auth/tool-configs.js';
import { serverInfoToolConfigs } from './server/info-configs.js';
import { channelToolConfigs } from './youtube/tools/channel-configs.js';
import { healthToolConfigs } from './youtube/tools/health-configs.js';
import { audienceToolConfigs } from './youtube/tools/audience-configs.js';
import { discoveryToolConfigs } from './youtube/tools/discovery-configs.js';
import { performanceToolConfigs } from './youtube/tools/performance-configs.js';
import { engagementToolConfigs } from './youtube/tools/engagement-configs.js';

// Aggregate all tool configurations
export const allToolConfigs = [
  ...authToolConfigs,
  ...serverInfoToolConfigs,
  ...channelToolConfigs,
  ...healthToolConfigs,
  ...audienceToolConfigs,
  ...discoveryToolConfigs,
  ...performanceToolConfigs,
  ...engagementToolConfigs,
];

// Export individual configs for potential selective registration
export {
  authToolConfigs,
  serverInfoToolConfigs,
  channelToolConfigs,
  healthToolConfigs,
  audienceToolConfigs,
  discoveryToolConfigs,
  performanceToolConfigs,
  engagementToolConfigs,
};
