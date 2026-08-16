'use client';

import { FormEvent, useEffect, useState } from 'react';
import styles from './page.module.css';
import { atualizarGerador, criarGerador, desativarGerador, getSession, listarGeradores, logout, type Gerador, type GeradorInput, type UsuarioSessao } from '../lib/api';

type Formulario = { identificacao: string; localizacao: string; predio: string; modelo: string; potencia_kva: string; numero_serie: string; tanque_capacidade_litros: string };
const vazio: Formulario = { identificacao: '', localizacao: '', predio: '', modelo: '', potencia_kva: '', numero_serie: '', tanque_capacidade_litros: '' };

function paraInput(gerador: Gerador): Formulario { return { identificacao: gerador.identificacao, localizacao: gerador.localizacao, predio: gerador.predio, modelo: gerador.modelo, potencia_kva: String(gerador.potencia_kva), numero_serie: gerador.numero_serie ?? '', tanque_capacidade_litros: gerador.tanque_capacidade_litros ? String(gerador.tanque_capacidade_litros) : '' }; }

export default function HomePage() {
  const [usuario, setUsuario] = useState<UsuarioSessao | null>(null);
  const [geradores, setGeradores] = useState<Gerador[]>([]);
  const [formulario, setFormulario] = useState<Formulario>(vazio);
  const [editando, setEditando] = useState<Gerador | null>(null);
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  async function carregar() {
    const resultado = await listarGeradores();
    setGeradores(resultado.geradores);
  }

  useEffect(() => { getSession().then(async ({ usuario: atual }) => { setUsuario(atual); await carregar(); }).catch(() => window.location.assign('/login')).finally(() => setCarregando(false)); }, []);

  function abrirNovo() { setEditando(null); setFormulario(vazio); setErro(''); setAberto(true); }
  function abrirEdicao(gerador: Gerador) { setEditando(gerador); setFormulario(paraInput(gerador)); setErro(''); setAberto(true); }
  function alterar(campo: keyof Formulario, valor: string) { setFormulario((atual) => ({ ...atual, [campo]: valor })); }

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setErro(''); setSalvando(true);
    const input: GeradorInput = { ...formulario, potencia_kva: Number(formulario.potencia_kva), tanque_capacidade_litros: formulario.tanque_capacidade_litros ? Number(formulario.tanque_capacidade_litros) : null, numero_serie: formulario.numero_serie || null };
    try { if (editando) await atualizarGerador(editando.id, input); else await criarGerador(input); await carregar(); setAberto(false); }
    catch (error) { setErro(error instanceof Error ? error.message : 'Não foi possível salvar o gerador'); }
    finally { setSalvando(false); }
  }

  async function remover(gerador: Gerador) { if (!window.confirm(`Desativar ${gerador.identificacao}?`)) return; try { await desativarGerador(gerador.id); await carregar(); } catch (error) { setErro(error instanceof Error ? error.message : 'Não foi possível desativar'); } }
  async function sair() { await logout(); window.location.assign('/login'); }
  if (carregando) return <main className={styles.loadingScreen}>Validando sessão...</main>;
  if (!usuario) return null;
  const podeEditar = usuario.perfil === 'administrador' || usuario.perfil === 'gestor';
  const podeDesativar = usuario.perfil === 'administrador';
  const identificador = usuario.login ?? usuario.email ?? 'usuário';

  return <main className="shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">G</span> geradores<span className="brand-dot">.</span></div>
      <div className="site-chip"><span /> HUL · manutenção</div>
      <nav aria-label="Navegação principal"><p>OPERAÇÃO</p><a href="#inicio">Visão geral</a><a className="active" href="#geradores">Geradores</a><a href="#ordens">Ordens de serviço</a><a href="#agenda">Agenda</a><p className="nav-section">SISTEMA</p><a href="#telemetria">Telemetria <small>futuro</small></a></nav>
      <div className="sidebar-foot"><strong>{usuario.nome}</strong><span>{usuario.perfil} · <button className={styles.logoutButton} onClick={sair}>sair</button></span></div>
    </aside>
    <section className="content" id="geradores">
      <header className="topbar"><span>HUL / Geradores</span><span className="status"><i /> {identificador}</span></header>
      <div className={styles.pageHeading}><div><p className="eyebrow">BASE OPERACIONAL</p><h1>Geradores<span>.</span></h1><p className="lead">Cadastro dos ativos que mantêm o hospital em funcionamento.</p></div>{podeEditar && <button className={styles.primaryButton} onClick={abrirNovo}>+ Novo gerador</button>}</div>
      {erro && !aberto && <p className={styles.feedback}>{erro}</p>}
      <section className={styles.stats}><div><span>ATIVOS CADASTRADOS</span><strong>{geradores.length.toString().padStart(2, '0')}</strong></div><div><span>ORIGEM DO DADO</span><strong className={styles.statLabel}>Cadastro manual</strong></div><div><span>STATUS</span><strong className={styles.online}>● Operacional</strong></div></section>
      <section className={styles.tableCard}><div className={styles.tableHeader}><div><span className={styles.tableKicker}>INVENTÁRIO</span><h2>Ativos cadastrados</h2></div><span className={styles.tableCount}>{geradores.length} registros</span></div>
        {geradores.length === 0 ? <div className={styles.empty}><div className={styles.emptyMark}>G</div><h3>Nenhum gerador cadastrado</h3><p>Comece registrando os dados reais dos equipamentos do HU.</p>{podeEditar && <button className={styles.textButton} onClick={abrirNovo}>Cadastrar primeiro gerador →</button>}</div> : <div className={styles.tableWrap}><table><thead><tr><th>Identificação</th><th>Localização</th><th>Modelo / potência</th><th>Tanque</th><th /></tr></thead><tbody>{geradores.map((gerador) => <tr key={gerador.id}><td><strong>{gerador.identificacao}</strong><small>{gerador.numero_serie ? `Série ${gerador.numero_serie}` : 'Série não informada'}</small></td><td>{gerador.predio}<small>{gerador.localizacao}</small></td><td>{gerador.modelo}<small>{gerador.potencia_kva} kVA</small></td><td>{gerador.tanque_capacidade_litros ? `${gerador.tanque_capacidade_litros} L` : '—'}</td><td className={styles.actions}>{podeEditar && <button onClick={() => abrirEdicao(gerador)}>Editar</button>}{podeDesativar && <button onClick={() => remover(gerador)}>Desativar</button>}</td></tr>)}</tbody></table></div>}
      </section>
    </section>
    {aberto && <div className={styles.modalBackdrop} role="presentation"><section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="form-title"><div className={styles.modalHeader}><div><span className={styles.tableKicker}>DADOS DO ATIVO</span><h2 id="form-title">{editando ? 'Editar gerador' : 'Novo gerador'}</h2></div><button className={styles.closeButton} onClick={() => setAberto(false)} aria-label="Fechar">×</button></div><form className={styles.generatorForm} onSubmit={salvar}><label>Identificação<input value={formulario.identificacao} onChange={(e) => alterar('identificacao', e.target.value)} placeholder="Ex.: GER-01" required /></label><label>Prédio<input value={formulario.predio} onChange={(e) => alterar('predio', e.target.value)} placeholder="Ex.: Casa de máquinas" required /></label><label className={styles.wide}>Localização<input value={formulario.localizacao} onChange={(e) => alterar('localizacao', e.target.value)} placeholder="Ex.: Subsolo · Ala norte" required /></label><label>Modelo<input value={formulario.modelo} onChange={(e) => alterar('modelo', e.target.value)} placeholder="Ex.: DSE 7320" required /></label><label>Potência (kVA)<input type="number" min="0.01" step="0.01" value={formulario.potencia_kva} onChange={(e) => alterar('potencia_kva', e.target.value)} required /></label><label>Número de série<input value={formulario.numero_serie} onChange={(e) => alterar('numero_serie', e.target.value)} /></label><label>Tanque (litros)<input type="number" min="0.01" step="0.01" value={formulario.tanque_capacidade_litros} onChange={(e) => alterar('tanque_capacidade_litros', e.target.value)} /></label>{erro && <p className={`${styles.feedback} ${styles.wide}`}>{erro}</p>}<div className={`${styles.modalActions} ${styles.wide}`}><button type="button" onClick={() => setAberto(false)}>Cancelar</button><button className={styles.primaryButton} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar gerador'}</button></div></form></section></div>}
  </main>;
}
