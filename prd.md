# PRD — Sistema de gestão de geradores do HUL

## 1. Identificação

- Produto: sistema de gestão de manutenção de geradores.
- Unidade: Hospital Universitário de Londrina (HUL).
- Responsável operacional: Fabio Dias, técnico de manutenção.
- Escopo inicial: 11 geradores, com dados completos disponíveis inicialmente para 3 ou 4.
- Empresa executora: terceirizada.

## 2. Objetivo

Centralizar o cadastro dos geradores, ordens de serviço, manutenção preventiva, manutenção corretiva, evidências e, posteriormente, telemetria e checklist móvel.

O sistema deve produzir histórico confiável e auditável de cada intervenção, permitindo responder quem executou, quando executou, em qual equipamento, qual problema foi encontrado, qual peça foi trocada e quais evidências foram anexadas.

## 3. Decisão de infraestrutura

Todo o sistema ficará dentro de uma única VM da Locaweb Cloud:

```text
VM Locaweb
├── Next.js
├── Supabase self-hosted via Docker Compose
├── PostgreSQL
├── Auth
├── PostgREST
├── Storage
├── Realtime
├── Studio
├── Caddy
└── scripts de backup e operação
```

Configuração inicial da VM:

- 2 vCPU;
- 4 GB RAM;
- 80 GB SSD ou maior;
- Ubuntu LTS ou Debian estável;
- rede guest isolada;
- IP público da Locaweb;
- chave SSH Ed25519.

Os 4 GB são aceitos para bootstrap e homologação. Serviços não utilizados, como Analytics e Edge Functions, permanecerão desabilitados. A capacidade deverá ser reavaliada antes de produção com carga, Storage crescente ou telemetria ativa.

Não será utilizado Supabase Cloud, backend hospedado separado ou banco externo para o runtime.

## 4. Usuários e perfis

### Administrador

- gerencia usuários e perfis;
- acessa todos os módulos;
- configura dados operacionais;
- consulta auditoria;
- executa rotinas administrativas.

### Gestor

- consulta geradores;
- cria e acompanha ordens de serviço;
- agenda preventivas;
- acompanha indicadores operacionais;
- não altera configurações críticas de infraestrutura.

### Técnico

- consulta geradores autorizados;
- executa OS atribuídas;
- registra diagnóstico, serviço, peças e evidências;
- futuramente executa checklist offline no mobile.

## 5. Módulos

### Módulo 1 — Painel web

Prioridade atual.

- autenticação e perfis;
- CRUD de geradores;
- CRUD de ordens de serviço;
- agenda de preventivas;
- manutenção corretiva;
- histórico e auditoria;
- painel operacional sem dados fictícios.

### Módulo 2 — Telemetria

Posterior ao painel web.

Controlador: DSE7320, comunicação Modbus RTU via RS485.

Parâmetros previstos:

- tensão;
- corrente;
- frequência;
- RPM;
- temperatura da água;
- tensão da bateria;
- nível de combustível.

O firmware só será criado depois do recebimento e validação do mapa oficial de registros Modbus.

### Módulo 3 — Aplicativo mobile

Posterior à definição da tecnologia mobile.

- offline-first;
- banco local SQLite;
- sincronização ao reconectar;
- checklist preventivo e corretivo;
- registro fotográfico vinculado à OS e ao item do checklist.

## 6. Requisitos funcionais

### RF-01 — Autenticação

O sistema deve permitir login, logout, refresh de sessão e recuperação de senha.

### RF-02 — Perfis

Cada usuário deve possuir exatamente um perfil inicial entre `administrador`, `gestor` e `tecnico`.

Novos usuários começam como `tecnico`. O primeiro administrador será criado por script administrativo seguro, fora do frontend.

### RF-03 — Geradores

Cada gerador deve suportar:

- identificação;
- localização/prédio;
- modelo;
- fabricante;
- potência;
- número de série;
- dados do tanque;
- status operacional;
- observações;
- data de cadastro e atualização.

### RF-04 — Ordens de serviço

Cada OS deve registrar:

- número identificador;
- gerador;
- tipo preventiva ou corretiva;
- abertura;
- responsável;
- descrição;
- execução;
- fechamento;
- status;
- peças e serviços realizados;
- evidências relacionadas.

### RF-05 — Preventivas

O sistema deve permitir configurar gerador, periodicidade e data programada, gerando uma agenda consultável.

### RF-06 — Corretivas

O sistema deve registrar motivo, diagnóstico, peça trocada, técnico responsável e resultado do atendimento.

### RF-07 — Auditoria

Alterações em dados operacionais devem registrar:

- usuário;
- data e hora em UTC;
- entidade;
- identificador da entidade;
- operação;
- dados anteriores;
- dados novos;
- origem da alteração.

## 7. Requisitos não funcionais

- Tabelas usarão `snake_case` e português técnico.
- Toda tabela Supabase terá RLS habilitado.
- Policies serão definidas por perfil.
- Segredos nunca serão enviados ao navegador ou commitados.
- PostgreSQL não será exposto diretamente à internet.
- Studio será acessado somente por túnel SSH e Basic Auth.
- Containers usarão `restart: unless-stopped`.
- Logs Docker terão limite de tamanho e quantidade.
- Backups serão criptografados e armazenados fora da VM.
- O painel não poderá exibir dados demo como se fossem reais.
- Timestamps serão armazenados em UTC e exibidos em `America/Sao_Paulo`.
- O sistema deverá funcionar inicialmente pela IP pública; domínio e HTTPS serão adicionados antes da produção.

## 8. Backup e recuperação

- Ferramenta: Restic.
- Destino: Cloudflare R2.
- Conteúdo: PostgreSQL, Storage e configurações necessárias.
- Retenção: 7 diários, 4 semanais e 3 mensais.
- Verificação periódica do repositório.
- Teste mensal de restauração.
- Monitoramento de armazenamento, operações Class A/B e custo.

## 9. Segurança de infraestrutura

- UFW liberando somente SSH, HTTP e HTTPS.
- SSH por chave Ed25519.
- Senha SSH desabilitada.
- Login direto de root desabilitado.
- Fail2ban.
- Atualizações de segurança.
- SMTP transacional via Resend.
- Alertas de disco em 70% e 85% enviados por email.

## 10. Fora do escopo inicial

- Supabase Cloud.
- Segunda aplicação backend separada.
- Mobile antes da definição Flutter/React Native.
- Firmware antes do mapa Modbus do DSE7320.
- Telemetria antes da fundação web.
- CRUD completo antes da criação e validação da infraestrutura.
- Dados fictícios em produção.

## 11. Critérios de sucesso

- VM Locaweb criada e acessível por SSH.
- Stack completo executando na mesma VM.
- Login de técnico e administrador funcionando.
- Sessão persistindo após reload.
- Logout e recuperação de senha funcionando.
- RLS impedindo acesso indevido entre perfis.
- Backup restaurável validado.
- Primeiros geradores cadastrados com histórico auditável.
- Nenhum dado operacional depende de mockup estático.
