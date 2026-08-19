# Memória operacional — Geradores HUL

## Decisões permanentes

- Desenvolvimento e execução local via Docker Compose.
- Sem Supabase e sem dependência de VM/provedor durante o desenvolvimento.
- Backend próprio com Fastify, PostgreSQL, autenticação por sessão e storage local.
- Frontend Next.js + TypeScript.
- Segredos, chaves e `.env` ficam somente em `C:\Users\0602382\.config\geradores-hul\`.
- Toda fase termina com testes de saída registrados.
- Não usar dados falsos como dados reais.
- `main` guarda versões estáveis; `dev` será a branch de integração.
- Templates de issues ficam em `.github/ISSUE_TEMPLATE/`; não criar issues automaticamente.
- Acesso só para usuários previamente liberados pelo administrador. `@uel.br` não autoriza acesso sozinho; cadastro público está bloqueado.

## Fases

### Fase 01 — Fundação Docker e scaffold

Status: concluída.

Compose local com web, API, PostgreSQL e storage; scaffold Next.js/Fastify; `.env.example`, README e estrutura inicial.

Testes: `docker compose config`, build/up, painel `200`, API `/health` `200`, storage health `200`, PostgreSQL aceitando conexão e resolução entre containers.

### Fase 02 — Autenticação e perfis

Status: concluída.

Usuário, perfis, sessões, auditoria inicial, login/logout/me, cookie HttpOnly e bootstrap de administrador.

Testes: migrations idempotentes, login/logout/me, sessão invalidada após logout, `401` e login de administrador.

### Fase 03 — Integração da autenticação no painel web

Status: concluída.

Tela de login, proteção do painel, logout e identificação do usuário/perfil.

Testes: build Next.js, `/login` `200`, `/` `200`, API `/health` `200`.

### Fase 04 — Geradores

Status: concluída.

- Migration `003_geradores.sql` com identificação, prédio, localização, modelo, potência, série, tanque, status e responsáveis.
- CRUD protegido: leitura para usuário autenticado; criação/edição para administrador ou gestor; desativação para administrador.
- Auditoria de criação, alteração e desativação.
- Painel visual com inventário, estado vazio, formulário e edição.
- A imagem do gerador fica em `apps/web/public/gerador-hul.png`.
- Regra inviolável: nenhum arquivo de código pode passar de 350 linhas. Se uma alteração aproximar ou ultrapassar o limite, dividir antes de continuar; arquivos já existentes acima do limite ficam registrados para refatoração posterior, sem corrigir nesta fase.

Testes: TypeScript da API, build Next.js, migration e tabela, endpoint sem sessão `401`, login temporário `200`, criação `201`, listagem, edição e desativação; dados temporários removidos.

### Fase 05 concluída: OS, planejamento preventivo, empresas e técnicos implementados.

Status: próxima.

- Tela exclusiva de administrador para listar usuários pendentes.
- Criar usuário com login ou e-mail `@uel.br`.
- Liberar, bloquear, alterar perfil e registrar auditoria.

## Rotina local

```powershell
docker compose up -d --build
docker compose ps
Invoke-WebRequest http://localhost:3001/login
Invoke-WebRequest http://localhost:4000/health
```

## Estrutura

```text
apps/web       Next.js
apps/api       Fastify + PostgreSQL
apps/web/public/gerador-hul.png
docker-compose.yml
.github/ISSUE_TEMPLATE/
mem.md
prd.md
```

## Integração ESP32 + Deep Sea 7320

Decisão de arquitetura: usar a placa PLC industrial HF-006Enet, baseada em ESP32, com Ethernet W5500, Wi-Fi, RS485 Modbus RTU e I/O industriais, como gateway de telemetria. O ESP32 será o mestre Modbus RTU; o controlador Deep Sea 7320 será configurado como escravo, com endereço, baud rate, paridade, stop bits e timeout confirmados no DSE Configuration Suite. Não ligar o ESP32 diretamente ao banco ou ao navegador.

Topologia proposta: cada gerador compatível terá seu próprio módulo PLC HF-006Enet. Um gerador com DSE8610 já possui comunicação direta e não exige módulo neste desenho inicial; dois pontos possuem USCA diferentes e a estratégia será decidida quando forem avaliados. Em cada ponto com módulo: DSE7320 → RS485 local → HF-006Enet. O módulo de cada gerador será ligado por cabo Ethernet à rede e enviará sua telemetria individual para a API Geradores HUL → PostgreSQL/Storage → painel web. O ESP32 deve publicar leituras periódicas por HTTPS autenticado ou MQTT com TLS; a API valida o dispositivo, registra a leitura e atualiza o último estado do gerador.

Dados iniciais: tensão de bateria, rotação, frequência, tensão/corrente, potência, fator de potência, horas de funcionamento, combustível, temperatura, pressão de óleo, modo de operação, estado do grupo e alarmes. O mapa oficial de registradores Modbus do DSE deve ser obtido para o modelo/firmware e serial do controlador antes de implementar os endereços; o manual confirma que o DSE7320 opera como escravo Modbus RTU e que o mapa Gencomm é fornecido pela Deep Sea Electronics.

Incorporação ao sistema: adicionar `dispositivo_telemetria` vinculado a `gerador`, `telemetria_leitura` para valores com timestamp, `telemetria_alarme` para transições de alarme e `ultimo_contato_em`/qualidade da comunicação. No painel, exibir estado online/offline, última leitura, valores atuais e histórico; não preencher lacunas com dados fictícios. Ações de comando remoto, incluindo AUTO/PARADA e acionamento/desligamento, ficam fora da primeira fase. A integração inicial será exclusivamente de leitura/telemetria; comandos só serão avaliados em uma fase posterior, com validação elétrica, permissões e auditoria.

Segurança e instalação: usar transceptor RS485 industrial adequado, proteção contra surto/isolação quando necessária, par trançado, aterramento conforme o projeto elétrico e terminação apenas nas extremidades do barramento. Alimentação do ESP32 deve ser regulada e protegida; a placa do anúncio precisa ser conferida quanto à faixa de alimentação, isolamento das entradas/saídas e capacidade real do RS485 antes da compra/instalação.

Próxima microfase: confirmar modelo exato da placa e do DSE7320, obter o mapa Gencomm, testar leitura somente em bancada com um controlador, definir payload/versionamento, implementar endpoint de ingestão e só depois instalar no gerador.

## Catálogo de parâmetros DSE7320

O conjunto de telemetria considerado para a integração será:

1. Gerador: tensão fase-neutro e fase-fase, frequência, corrente, potência ativa por fase e total (kW), potência aparente por fase e total (kVA), potência reativa por fase e total (kvar), fator de potência por fase e médio, energia acumulada (kWh, kVAh e kvarh), sequência de fases, esquema de carga, nominal do gerador e configuração ativa.
2. Rede elétrica: no DSE7320 MKII, tensão fase-neutro e fase-fase, frequência, corrente quando houver TCs configurados na carga, potência, energia, fator de potência, sequência de fases e configuração ativa.
3. Motor: rotação em RPM, pressão do óleo, temperatura do líquido de arrefecimento, tensão da bateria, nível de combustível, tempo de funcionamento e DTCs. Quando a ECU/CAN suportar, também temperatura do óleo, pressão do turbo, consumo instantâneo, carga percentual do motor, nível de DEF/AdBlue e demais parâmetros disponibilizados pela ECU.
4. Acumulados: horas de funcionamento do motor, número de partidas e energia acumulada em kWh, kvarh e kVAh, respeitando os limites e possibilidade de reset definidos pelo controlador.

Os parâmetros condicionais devem ser publicados com qualidade/status explícito (`disponivel`, `nao_configurado`, `sem_suporte` ou `falha_comunicacao`), sem substituir ausência por zero ou dado fictício. O payload deve preservar unidade, timestamp, origem (DSE, ECU/CAN ou cálculo), fase quando aplicável e qualidade da leitura.
## Configuração RS485 do DSE7320

A comunicação local entre cada DSE7320 e sua respectiva HF-006Enet será Modbus RTU em RS485 half-duplex, com 2 fios + comum. Não haverá um único ESP32 compartilhado pelos geradores: cada ponto que precisar de gateway terá um módulo independente. O DSE8610 e as duas USCAs diferentes permanecem como decisões de compatibilidade para uma etapa posterior. Parâmetros de referência para a configuração inicial: baud rate ajustável até 115 kbaud, padrão de fábrica 19200; ID do servidor padrão 10; terminação externa de 120 Ω quando o módulo estiver em uma extremidade do barramento.

Pinagem informada do DSE7320: terminal 56 = blindagem, terminal 57 = B (+), terminal 58 = A (-). A ligação deve ser conferida no manual e no esquema da instalação antes de energizar, especialmente a polaridade A/B e o uso do comum. Cada HF-006Enet será configurada como mestre Modbus RTU do seu DSE7320 local, e cada DSE7320 como servidor/escravo. A Ethernet será o transporte da telemetria até a API.

Configuração de bancada: começar com 19200 baud, ID 10 e leitura somente; confirmar paridade, bits de parada, timeout e mapa de registradores no Configuration Suite/Gencomm. Só aumentar a velocidade ou alterar o endereço depois de validar a comunicação estável.