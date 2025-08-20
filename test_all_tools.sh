#!/bin/bash

tools=("check_auth_status" "get_server_info" "get_channel_info" "get_channel_videos" "get_geographic_distribution" "get_subscriber_analytics" "get_optimal_posting_time" "get_traffic_sources" "get_engagement_metrics")

for i in "${!tools[@]}"; do
  tool="${tools[$i]}"
  echo "Testing tool $((i+1)): $tool"
  
  if [[ "$tool" == "check_auth_status" || "$tool" == "get_server_info" || "$tool" == "get_channel_info" || "$tool" == "get_channel_videos" ]]; then
    args='{}'
  else
    args='{"startDate": "2025-01-01", "endDate": "2025-01-15"}'
  fi
  
  result=$(echo "{\"jsonrpc\": \"2.0\", \"id\": $((i+1)), \"method\": \"tools/call\", \"params\": {\"name\": \"$tool\", \"arguments\": $args}}" | node build/index.js 2>/dev/null)
  
  if echo "$result" | grep -q '"result"'; then
    echo "✅ $tool: SUCCESS"
  else
    echo "❌ $tool: FAILED"
    echo "$result"
  fi
  echo "---"
done
