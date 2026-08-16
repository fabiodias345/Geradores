# Geradores HUL

Sistema local em Docker para gestão de manutenção dos geradores do Hospital Universitário de Londrina.

## Requisitos

- Docker Desktop com Docker Compose;
- PowerShell;
- nenhum segredo necessário para a Fase 01.

## Executar localmente

```powershell
Copy-Item .env.example .env
docker compose up --build
```

URLs locais:

- painel: http://localhost:3001
- API: http://localhost:4000/health
- Storage local: http://localhost:9000
- console do Storage: http://localhost:9001

O PostgreSQL não é exposto no host; a API acessa o banco pela rede Docker.

Parar:

```powershell
docker compose down
```

Os dados persistem nos volumes Docker `postgres_data` e `storage_data`.

## Segredos

Credenciais reais e arquivos `.env` ficam somente em:

```text
C:\Users\0602382\.config\geradores-hul\
```

O repositório deve conter somente `.env.example` sem credenciais reais.
