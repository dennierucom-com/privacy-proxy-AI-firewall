# privacy-proxy-AI-firewall

Privacy Proxy, AI Firewall, or Data Guardrail.

# Local vector database (ChromaDB)

Container Name: local_chroma_firewall
Port: 8000

# To start the backend

docker compose -f scripts/docker-compose.yml up -d

# To stop the backend

docker compose -f scripts/docker-compose.yml down

# To view logs

docker logs local_chroma_firewall
