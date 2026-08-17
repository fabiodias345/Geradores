'use client';

import { FormEvent, useEffect, useState } from 'react';
import styles from './service-panel.module.css';
import { atualizarServico, apagarServico, criarServico, listarGeradores, listarServicos, listarTecnicos, type Gerador, type Servico, type ServicoInput, type Tecnico } from '../lib/api';

const hoje = new Date().toISOString().slice(0, 10);
const vazio: ServicoInput = { gerador_id: '', tecnico_id: null, tipo: 'corretiva', titulo: '', data_os: hoje, descricao: '', observacoes: '' };

export default function ServicePanel() {
  const [geradores, setGeradores] = useState<Gerador[]>([]);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [formulario, setFormulario] = useState(vazio);
  const [editando, setEditando] = useState<Servico | null>(null);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function carregar() { const [g, t, s] = await Promise.all([listarGeradores(), listarTecnicos(), listarServicos()]); setGeradores(g.geradores); setTecnicos(t.tecnicos.filter((tecnico) => tecnico.ativo)); setServicos(s.servicos); }
  useEffect(() => { carregar().catch((error) => setErro(error instanceof Error ? error.message : 'Não foi possível carregar as O.S.')); }, []);
  function alterar(campo: keyof ServicoInput, valor: string) { setFormulario((atual) => ({ ...atual, [campo]: campo === 'tecnico_id' ? valor || null : valor })); }
  function editar(servico: Servico) { setEditando(servico); setFormulario({ gerador_id: servico.gerador_id, tecnico_id: servico.tecnico_id, tipo: servico.tipo, titulo: servico.titulo, data_os: servico.data_os.slice(0, 10), descricao: servico.descricao ?? '', observacoes: servico.observacoes ?? '' }); }
  function novo() { setEditando(null); setFormulario({ ...vazio, data_os: new Date().toISOString().slice(0, 10) }); setErro(''); }
  async function salvar(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSalvando(true); setErro(''); try { if (editando) await atualizarServico(editando.id, formulario); else await criarServico(formulario); await carregar(); novo(); } catch (error) { setErro(error instanceof Error ? error.message : 'Não foi possível salvar a O.S.'); } finally { setSalvando(false); } }
  async function apagar(servico: Servico) { if (!window.confirm(`Apagar a O.S. ${servico.titulo}?`)) return; try { await apagarServico(servico.id); await carregar(); } catch (error) { setErro(error instanceof Error ? error.message : 'Não foi possível apagar a O.S.'); } }

  return <section className={styles.shell} id="servicos"><div className={styles.heading}><div><p className="eyebrow">NOVA ORDEM DE SERVIÇO</p><h1>Manutenção corretiva e preventiva</h1><p>Crie a O.S. e encaminhe para o técnico responsável.</p></div></div><form className={styles.form} onSubmit={salvar}><label>Gerador<select required value={formulario.gerador_id} onChange={(e) => alterar('gerador_id', e.target.value)}><option value="">Selecione</option>{geradores.map((gerador) => <option key={gerador.id} value={gerador.id}>{gerador.identificacao}</option>)}</select></label><label>Tipo<select value={formulario.tipo} onChange={(e) => alterar('tipo', e.target.value)}><option value="corretiva">Corretiva</option><option value="preventiva">Preventiva</option></select></label><label>Título<input required value={formulario.titulo} onChange={(e) => alterar('titulo', e.target.value)} placeholder="Ex.: troca de óleo" /></label><label>Técnico responsável<select value={formulario.tecnico_id ?? ''} onChange={(e) => alterar('tecnico_id', e.target.value)}><option value="">Selecione o técnico</option>{tecnicos.map((tecnico) => <option key={tecnico.id} value={tecnico.id}>{tecnico.nome} · {tecnico.perfil === 'tecnico_pro' ? 'Pro' : 'Técnico'}</option>)}</select></label><label>Data da O.S.<input type="date" required value={formulario.data_os} onChange={(e) => alterar('data_os', e.target.value)} /></label><label>Descrição<textarea value={formulario.descricao ?? ''} onChange={(e) => alterar('descricao', e.target.value)} /></label><label>Observações<textarea value={formulario.observacoes ?? ''} onChange={(e) => alterar('observacoes', e.target.value)} /></label><div className={styles.actions}><button type="button" onClick={novo}>Limpar</button><button className={styles.primary} disabled={salvando}>{salvando ? 'Salvando...' : editando ? 'Salvar edição' : 'Salvar serviço'}</button></div></form>{erro && <p className={styles.error}>{erro}</p>}<div className={styles.list}><h2>Ordens de serviço criadas</h2>{servicos.map((servico) => <article key={servico.id}><div><strong>{servico.titulo}</strong><span>{servico.gerador_nome} · {servico.tipo === 'corretiva' ? 'Corretiva' : 'Preventiva'} · {servico.tecnico_nome || 'Sem técnico'}</span></div><div className={styles.rowActions}><button onClick={() => editar(servico)}>Editar</button><button onClick={() => apagar(servico)}>Apagar</button></div></article>)}{!servicos.length && <p className={styles.empty}>Nenhuma O.S. criada.</p>}</div></section>;
}
