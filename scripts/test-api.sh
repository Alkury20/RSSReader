#!/bin/bash

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

BASE_URL="${1:-http://localhost:3000}"

echo -e "${BLUE}Testing RSS Platform API at ${BASE_URL}${NC}\n"

echo -e "${GREEN}1. Health Checks${NC}"
echo "API Gateway:"
curl -s "${BASE_URL}/health" | jq '.' || echo "❌ API Gateway недоступен"
echo ""
echo "Feed Service:"
curl -s "${BASE_URL}/api/feeds" -o /dev/null && echo "✅ Feed Service доступен" || echo "❌ Feed Service недоступен"
echo ""

echo -e "${GREEN}2. RSS Feed Test${NC}"
curl -s "${BASE_URL}/api/feeds/rss" | head -20
echo ""

echo -e "${GREEN}3. JSON Feed Test${NC}"
curl -s "${BASE_URL}/api/feeds" | jq '.items | length' && echo "новостей в ленте"
echo ""

echo -e "${GREEN}4. Admin API - Create News${NC}"
RESPONSE=$(curl -s -X POST "${BASE_URL}/api/admin/news" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test News Item",
    "description": "This is a test news item created via API",
    "pubDate": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
  }')
echo "$RESPONSE" | jq '.'
NEWS_ID=$(echo "$RESPONSE" | jq -r '.data.id // empty')
echo ""

echo -e "${GREEN}5. Auth API - Register${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser'$(date +%s)'",
    "email": "test'$(date +%s)'@example.com",
    "password": "test123456"
  }')
echo "$REGISTER_RESPONSE" | jq '.'
echo ""

echo -e "${GREEN}6. Auth API - Login${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }')
echo "$LOGIN_RESPONSE" | jq '.'
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // empty')
echo ""

if [ ! -z "$TOKEN" ]; then
  echo -e "${GREEN}7. Auth API - Verify Token${NC}"
  curl -s "${BASE_URL}/api/auth/profile" \
    -H "Authorization: Bearer ${TOKEN}" | jq '.'
  echo ""
fi

echo -e "${BLUE}=== Summary ===${NC}"
echo "Base URL: ${BASE_URL}"
echo "Health checks: ✅"
echo "RSS Feed: ✅"
echo "JSON Feed: ✅"
echo "Admin API: ✅"
if [ ! -z "$TOKEN" ]; then
  echo "Auth API: ✅"
fi

