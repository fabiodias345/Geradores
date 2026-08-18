import type { PoolClient } from 'pg';

export function registrarAuditoria(client: PoolClient, usuarioId: string, entidade: string, entidadeId: string, operacao: string, anterior: unknown, novo: unknown) {
  return client.query(
    `insert into registro_auditoria (usuario_id, entidade, entidade_id, operacao, dados_anteriores, dados_novos)
     values ($1, $2, $3, $4, $5, $6)`,
    [usuarioId, entidade, entidadeId, operacao, anterior ? JSON.stringify(anterior) : null, novo ? JSON.stringify(novo) : null],
  );
}
