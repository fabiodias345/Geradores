# Contribuição

## Branches

- `main`: somente código validado e em funcionamento.
- `dev`: integração do desenvolvimento.
- `feature/<descricao>`: nova funcionalidade criada a partir de `dev`.
- `fix/<descricao>`: correção criada a partir de `dev`.
- `chore/<descricao>`: manutenção, Docker, documentação ou infraestrutura.

Não desenvolver diretamente em `main`.

## Fluxo obrigatório

1. Criar ou atualizar uma issue usando um template do projeto.
2. Criar branch a partir de `dev`.
3. Implementar somente o escopo da issue.
4. Executar testes de saída antes do commit.
5. Fazer commit Conventional Commits.
6. Abrir Pull Request para `dev`.
7. Validar a integração em `dev`.
8. Promover para `main` somente quando estiver funcionando.

## Regras de aceite

- Nenhum segredo, chave, token ou `.env` real no Git.
- Dados fictícios não podem ser apresentados como dados operacionais.
- Toda alteração de banco deve ter migration versionada.
- Toda alteração funcional deve ter teste de saída registrado.
- Alterações de permissão devem testar administrador, gestor e técnico quando aplicável.
- Alterações de infraestrutura devem incluir validação de containers e rollback.
- Arquivos de código devem permanecer abaixo de 500 linhas; extrair helpers quando necessário.

## Commits

Exemplos:

```text
feat(auth): add technician login
fix(os): prevent closing order without execution data
chore(docker): add local postgres volume
docs: define issue workflow
```
