.PHONY: restart up down logs

restart:
	docker compose down -v
	docker compose up --build -d

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f
