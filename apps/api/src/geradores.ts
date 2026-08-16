import type { PoolClient } from 'pg';
import { pool } from './db.js';

export type GeradorInput = {
  identificacao: string;
  localizacao: string;
  predio: string;
  modelo: string;
  potencia_kva: number;
  numero_serie?: string | null;
  tanque_capacidade_litros?: number | null;
};

function texto(valor: unknown, campo: string) {
  if (typeof valor !== 'string' || !valor.trim()) throw new Error(`${campo} é obrigatório`);
  return valor.trim();
}

function numero(valor: unknown, campo: string, obrigatorio = false) {
  if (valor === null || valor === undefined || valor === '') {
    if (obrigatorio) throw new Error(`${campo} é obrigatório`);
    return null;
  }
  const resultado = Number(valor);
  if (!Number.isFinite(resultado) || resultado <= 0) throw new Error(`${campo} deve ser maior que zero`);
  return resultado;
}

export function validarGerador(input: Partial<GeradorInput>, parcial = false): GeradorInput | Partial<GeradorInput> {
  const resultado: Partial<GeradorInput> = {};
  if (!parcial || input.identificacao !== undefined) resultado.identificacao = texto(input.identificacao, 'identificação');
  if (!parcial || input.localizacao !== undefined) resultado.localizacao = texto(input.localizacao, 'localização');
  if (!parcial || input.predio !== undefined) resultado.predio = texto(input.predio, 'prédio');
  if (!parcial || input.modelo !== undefined) resultado.modelo = texto(input.modelo, 'modelo');
  if (!parcial || input.potencia_kva !== undefined) resultado.potencia_kva = numero(input.potencia_kva, 'potência (kVA)', true) as number;
  if (input.numero_serie !== undefined) resultado.numero_serie = input.numero_serie?.trim() || null;
  if (input.tanque_capacidade_litros !== undefined) resultado.tanque_capacidade_litros = numero(input.tanque_capacidade_litros, 'capacidade do tanque (litros)');
  return resultado;
}

function auditar(client: PoolClient, usuarioId: string, operacao: string, id: string, anterior: unknown, novo: unknown) {
  return client.query(
    'insert into registro_auditoria (usuario_id, entidade, entidade_id, operacao, dados_anteriores, dados_novos) values ($1, $2, $3, $4, $5, $6)',
    [usuarioId, 'gerador', id, operacao, anterior ? JSON.stringify(anterior) : null, novo ? JSON.stringify(novo) : null],
  );
}

export async function listarGeradores() {
  const result = await pool.query('select * from gerador where ativo = true order by predio, identificacao');
  return result.rows;
}

export async function criarGerador(input: GeradorInput, usuarioId: string) {
  const client = await pool.connect();
  try {
    await client.query('begin');
    const result = await client.query(
      `insert into gerador (identificacao, localizacao, predio, modelo, potencia_kva, numero_serie, tanque_capacidade_litros, criado_por, atualizado_por)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$8) returning *`,
      [input.identificacao, input.localizacao, input.predio, input.modelo, input.potencia_kva, input.numero_serie ?? null, input.tanque_capacidade_litros ?? null, usuarioId],
    );
    await auditar(client, usuarioId, 'criar', result.rows[0].id, null, result.rows[0]);
    await client.query('commit');
    return result.rows[0];
  } catch (error) { await client.query('rollback'); throw error; } finally { client.release(); }
}

export async function atualizarGerador(id: string, input: Partial<GeradorInput>, usuarioId: string) {
  const client = await pool.connect();
  try {
    await client.query('begin');
    const anterior = await client.query('select * from gerador where id = $1 and ativo = true for update', [id]);
    if (!anterior.rowCount) throw new Error('gerador não encontrado');
    const atual = { ...anterior.rows[0], ...input };
    const result = await client.query(
      `update gerador set identificacao=$1, localizacao=$2, predio=$3, modelo=$4, potencia_kva=$5, numero_serie=$6, tanque_capacidade_litros=$7, atualizado_por=$8, atualizado_em=now()
       where id=$9 returning *`,
      [atual.identificacao, atual.localizacao, atual.predio, atual.modelo, atual.potencia_kva, atual.numero_serie ?? null, atual.tanque_capacidade_litros ?? null, usuarioId, id],
    );
    await auditar(client, usuarioId, 'atualizar', id, anterior.rows[0], result.rows[0]);
    await client.query('commit');
    return result.rows[0];
  } catch (error) { await client.query('rollback'); throw error; } finally { client.release(); }
}

export async function desativarGerador(id: string, usuarioId: string) {
  const client = await pool.connect();
  try {
    await client.query('begin');
    const anterior = await client.query('select * from gerador where id = $1 and ativo = true for update', [id]);
    if (!anterior.rowCount) throw new Error('gerador não encontrado');
    const result = await client.query('update gerador set ativo=false, atualizado_por=$1, atualizado_em=now() where id=$2 returning *', [usuarioId, id]);
    await auditar(client, usuarioId, 'desativar', id, anterior.rows[0], result.rows[0]);
    await client.query('commit');
  } catch (error) { await client.query('rollback'); throw error; } finally { client.release(); }
}
