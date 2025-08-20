#!/bin/bash

health_tools=("get_channel_overview" "get_comparison_metrics" "get_average_view_percentage" "get_video_demographics")

for i in "${!health_tools[@]}"; do
  tool="${health_tools[$i]}"
  echo "Testing health tool $((i+1)): $tool"
  
  if [[ "$tool" == "get_comparison_metrics" ]]; then
    args='{"metrics": ["views", "estimatedMinutesWatched"], "period1Start": "2024-12-01", "period1End": "2024-12-15", "period2Start": "2025-01-01", "period2End": "2025-01-15"}'
  else
    args='{"startDate": "2025-01-01", "endDate": "2025-01-15"}'
  fi
  
  result=$(echo "{\"jsonrpc\": \"2.0\", \"id\": $((i+20)), \"method\": \"tools/call\", \"params\": {\"name\": \"$tool\", \"arguments\": $args}}" | node build/index.js 2>/dev/null)
  
  if echo "$result" | grep -q '"result"'; then
    echo "✅ $tool: SUCCESS"
  else
    echo "❌ $tool: FAILED"
    echo "$result"
  fi
  echo "---"
done
