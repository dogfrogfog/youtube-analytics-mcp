#!/bin/bash

video_tools=("get_search_terms" "get_audience_retention" "get_retention_dropoff_points")
video_id="CmIEeYMDh3I"

for i in "${!video_tools[@]}"; do
  tool="${video_tools[$i]}"
  echo "Testing video tool $((i+1)): $tool"
  
  if [[ "$tool" == "get_retention_dropoff_points" ]]; then
    args="{\"videoId\": \"$video_id\", \"startDate\": \"2025-01-01\", \"endDate\": \"2025-01-15\", \"threshold\": 0.1}"
  else
    args="{\"videoId\": \"$video_id\", \"startDate\": \"2025-01-01\", \"endDate\": \"2025-01-15\"}"
  fi
  
  result=$(echo "{\"jsonrpc\": \"2.0\", \"id\": $((i+10)), \"method\": \"tools/call\", \"params\": {\"name\": \"$tool\", \"arguments\": $args}}" | node build/index.js 2>/dev/null)
  
  if echo "$result" | grep -q '"result"'; then
    echo "✅ $tool: SUCCESS"
  else
    echo "❌ $tool: FAILED"
    echo "$result"
  fi
  echo "---"
done
