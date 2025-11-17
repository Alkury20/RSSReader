.PHONY: help build up down logs restart clean test

help:
	@echo "Доступные команды:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

logs-feed:
	docker-compose logs -f feed-service

logs-admin:
	docker-compose logs -f admin-service

logs-auth:
	docker-compose logs -f auth-service

logs-gateway:
	docker-compose logs -f api-gateway

restart:
	docker-compose restart

clean:
	docker-compose down -v
	docker system prune -f

test:
	@echo "Тесты будут добавлены позже"

health:
	@echo "Checking services health..."
	@curl -s http://localhost:3000/health | jq '.' || echo "API Gateway: недоступен"
	@curl -s http://localhost:3001/health | jq '.' || echo "Feed Service: недоступен"
	@curl -s http://localhost:3002/health | jq '.' || echo "Admin Service: недоступен"
	@curl -s http://localhost:3003/health | jq '.' || echo "Auth Service: недоступен"

init-db:
	@echo "Creating test news item..."
	@curl -X POST http://localhost:3000/api/admin/news \
		-H "Content-Type: application/json" \
		-d '{"title":"Test News","description":"This is a test news item","pubDate":"2024-01-01T00:00:00Z"}' \
		| jq '.' || echo "Ошибка создания новости"

