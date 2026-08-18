import { pool } from './db.js';

export type EmpresaInput = { nome: string; cnpj: string; telefone?: string | null; email?: string | null; endereco?: string | null; cidade?: string | null; contato?: string | null };
const texto = (v: unknown) => typeof v === 'string' ? v.trim() : '';
export function validarEmpresa(input: Partial<EmpresaInput>, parcial = false): EmpresaInput | Partial<EmpresaInput> {
  const r: Partial<EmpresaInput> = {};
  for (const campo of ['nome', 'cnpj'] as const) if (!parcial || input[campo] !== undefined) { r[campo] = texto(input[campo]); if (!r[campo]) throw new Error(`${campo} é obrigatório`); }
  for (const campo of ['telefone', 'email', 'endereco', 'cidade', 'contato'] as const) if (input[campo] !== undefined) r[campo] = texto(input[campo]) || null;
  if (r.email && !/^\S+@\S+\.\S+$/.test(r.email)) throw new Error('e-mail da empresa inválido');
  return r;
}
export async function listarEmpresas() { const result = await pool.query('select * from empresa where ativo=true order by nome'); return result.rows; }
export async function criarEmpresa(input: EmpresaInput, usuarioId: string) { const result = await pool.query(`insert into empresa (nome,cnpj,telefone,email,endereco,cidade,contato) values ($1,$2,$3,$4,$5,$6,$7) returning *`, [input.nome,input.cnpj,input.telefone ?? null,input.email ?? null,input.endereco ?? null,input.cidade ?? null,input.contato ?? null]); return result.rows[0]; }
export async function atualizarEmpresa(id: string, input: Partial<EmpresaInput>) { const old = await pool.query('select * from empresa where id=$1 and ativo=true',[id]); if (!old.rowCount) throw new Error('empresa não encontrada'); const a={...old.rows[0],...input}; const result=await pool.query(`update empresa set nome=$1,cnpj=$2,telefone=$3,email=$4,endereco=$5,cidade=$6,contato=$7,atualizado_em=now() where id=$8 returning *`,[a.nome,a.cnpj,a.telefone??null,a.email??null,a.endereco??null,a.cidade??null,a.contato??null,id]); return result.rows[0]; }
export async function apagarEmpresa(id: string) { const result=await pool.query('update empresa set ativo=false,atualizado_em=now() where id=$1 and ativo=true returning id',[id]); if(!result.rowCount) throw new Error('empresa não encontrada'); }