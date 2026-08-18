'use client';

import Image from 'next/image';
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import styles from './page.module.css';
import AdminPanel from './admin-panel';
import ServicePanel from './service-panel';
import PlanningPanel from './planning-panel';
import { atualizarGerador, criarGerador, desativarGerador, getSession, listarGeradores, logout, resolverFotoUrl, type Gerador, type GeradorInput, type UsuarioSessao } from '../lib/api';

type Formulario = {
  gerador_local: string; fuel: string; usca_modelo: string; tensao_ac: string; tensao_dc: string; corrente: string; kva: string; fabricado: string;
  filtro_combustivel: string; filtro_oleo: string; filtro_agua: string; filtro_ar: string; motor_marca: string; motor_modelo: string; motor_numero_serie: string;
  gerador_marca: string; gerador_modelo: string; gerador_numero_serie: string; foto_url: string;
};
const vazio: Formulario = { gerador_local: '', fuel: '', usca_modelo: '', tensao_ac: '', tensao_dc: '', corrente: '', kva: '', fabricado: '', filtro_combustivel: '', filtro_oleo: '', filtro_agua: '', filtro_ar: '', motor_marca: '', motor_modelo: '', motor_numero_serie: '', gerador_marca: '', gerador_modelo: '', gerador_numero_serie: '', foto_url: '' };
function paraInput(g: Gerador): Formulario { return { ...vazio, ...g.dados_tecnicos, foto_url: g.foto_url ?? '' }; }

export default function HomePage() {
  const [usuario, setUsuario] = useState<UsuarioSessao | null>(null);
  const [geradores, setGeradores] = useState<Gerador[]>([]);
  const [formulario, setFormulario] = useState(vazio);
  const [editando, setEditando] = useState<Gerador | null>(null);
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [administracao, setAdministracao] = useState(false);
  const [servicoView, setServicoView] = useState(false);
  const [planejamentoView, setPlanejamentoView] = useState(false);

  async function carregar() { const resultado = await listarGeradores(); setGeradores(resultado.geradores); }
  useEffect(() => { getSession().then(async ({ usuario: atual }) => { setUsuario(atual); await carregar(); }).catch(() => window.location.assign('/login')).finally(() => setCarregando(false)); }, []);
  function abrirNovo() { setEditando(null); setFormulario(vazio); setErro(''); setAberto(true); }
  function abrirEdicao(g: Gerador) { setEditando(g); setFormulario(paraInput(g)); setErro(''); setAberto(true); }
  function alterar(campo: keyof Formulario, valor: string) { setFormulario((atual) => ({ ...atual, [campo]: valor })); }
  function selecionarFoto(event: ChangeEvent<HTMLInputElement>) { const arquivo = event.target.files?.[0]; if (!arquivo) return; if (!arquivo.type.startsWith('image/')) { setErro('Escolha um arquivo de imagem.'); return; } if (arquivo.size > 4 * 1024 * 1024) { setErro('A foto deve ter no mÃƒÂ¡ximo 4 MB.'); return; } const leitor = new FileReader(); leitor.onload = () => alterar('foto_url', String(leitor.result)); leitor.readAsDataURL(arquivo); }
  async function salvar(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setErro(''); setSalvando(true); const input: GeradorInput = { identificacao: formulario.gerador_local || 'Gerador sem identificaÃƒÂ§ÃƒÂ£o', localizacao: formulario.gerador_local || 'NÃƒÂ£o informado', predio: 'NÃƒÂ£o informado', modelo: formulario.gerador_modelo || formulario.motor_modelo || 'NÃƒÂ£o informado', potencia_kva: Number(formulario.kva) || 0.01, numero_serie: formulario.gerador_numero_serie || null, tanque_capacidade_litros: null, foto_url: formulario.foto_url || null, dados_tecnicos: Object.fromEntries(Object.entries(formulario).filter(([chave]) => chave !== 'foto_url')) }; try { if (editando) await atualizarGerador(editando.id, input); else await criarGerador(input); await carregar(); setAberto(false); } catch (error) { setErro(error instanceof Error ? error.message : 'NÃƒÂ£o foi possÃƒÂ­vel salvar o gerador'); } finally { setSalvando(false); } }
  async function remover(g: Gerador) { if (!window.confirm(`Desativar ${g.identificacao}?`)) return; try { await desativarGerador(g.id); await carregar(); } catch (error) { setErro(error instanceof Error ? error.message : 'NÃƒÂ£o foi possÃƒÂ­vel desativar'); } }
  async function sair() { await logout(); window.location.assign('/login'); }
  if (carregando) return <main className={styles.loadingScreen}>Validando sessÃƒÂ£o...</main>;
  if (!usuario) return null;
  const podeEditar = usuario.perfil === 'administrador' || usuario.perfil === 'gestor';
  const podeDesativar = usuario.perfil === 'administrador';
  const identificador = usuario.login ?? usuario.email ?? 'usuÃƒÂ¡rio';

  return <main className="dashboard-shell">
    <header className="main-header">
      <div className="brand"><span className="brand-mark">H</span><div><strong>HUNPR GERADORES</strong><small>CONTROLE DE MANUTENÃƒâ€¡ÃƒÆ’O</small></div></div>
      <nav aria-label="NavegaÃƒÂ§ÃƒÂ£o principal"><a className={!administracao && !servicoView && !planejamentoView ? "active" : ""} href="#supervisorio" onClick={(event) => { event.preventDefault(); setAdministracao(false); setServicoView(false); setPlanejamentoView(false); }}>SupervisÃƒÂ³rio</a><a className={servicoView ? "active" : ""} href="#servicos" onClick={(event) => { event.preventDefault(); setAdministracao(false); setPlanejamentoView(false); setServicoView(true); }}>ServiÃƒÂ§os</a><a className={planejamentoView ? "active" : ""} href="#planejamento" onClick={(event) => { event.preventDefault(); setAdministracao(false); setServicoView(false); setPlanejamentoView(true); }}>Planejamento</a><a className={administracao ? "active" : ""} href="#administracao" onClick={(event) => { event.preventDefault(); setServicoView(false); setPlanejamentoView(false); setAdministracao(true); }}>AdministraÃƒÂ§ÃƒÂ£o</a></nav>
      <div className="account"><button>{usuario.nome || identificador}</button><button className={styles.logoutButton} onClick={sair}>Sair</button></div>
    </header>
    <section className={`dashboard-content ${administracao || servicoView || planejamentoView ? styles.hidden : ""}`} id="geradores">
      <div className={styles.pageHeading}><div><p className="eyebrow">SUPERVISÃƒâ€œRIO Ã‚Â· VISÃƒÆ’O GERAL</p><h1>Estado da frota</h1><p className="lead">Selecione um gerador para consultar os detalhes operacionais.</p></div><div className="system-status"><strong>Ã¢â‚¬Â¢ SISTEMA ONLINE</strong><span>Dados disponÃƒÂ­veis na base operacional</span></div></div>
      {erro && !aberto && <p className={styles.feedback}>{erro}</p>}
      <section className={styles.fleetCard}>
        <div className={styles.fleetHeader}><h2>{geradores.length} {geradores.length === 1 ? 'gerador monitorado' : 'geradores monitorados'}</h2><span>clique em um equipamento para abrir</span></div>
        {geradores.length === 0 ? <div className={styles.empty}><div className={styles.emptyMark}>H</div><h3>Nenhum gerador cadastrado</h3><p>Cadastre o primeiro equipamento para acompanhar a frota.</p>{podeEditar && <button className={styles.textButton} onClick={abrirNovo}>Cadastrar primeiro gerador Ã¢â€ â€™</button>}</div> : <div className={styles.generatorGrid}>{geradores.map((g) => <article className={styles.generatorCard} key={g.id} onClick={() => abrirEdicao(g)}>{g.foto_url ? <Image className={styles.generatorPhoto} src={resolverFotoUrl(g.foto_url) || ""} alt={`Foto de ${g.identificacao}`} width={150} height={110} /> : <div className={styles.photoPlaceholder}>Sem foto</div>}<div className={styles.generatorCardContent}><h3>{g.identificacao}</h3><strong>{g.dados_tecnicos?.gerador_numero_serie || 'Sem nÃƒÂºmero de sÃƒÂ©rie'}</strong><span className={styles.machineStatus}><i /> PARADO</span><div className={styles.cardDivider} /><b>Funcionamento <em>Ã¢â‚¬â€œ</em></b><small>{g.predio} Ã‚Â· {g.localizacao}</small>{podeDesativar && <button className={styles.cardAction} onClick={(event) => { event.stopPropagation(); remover(g); }}>Desativar</button>}</div></article>)}</div>}
      </section>
      {podeEditar && <button className={styles.floatingAdd} onClick={abrirNovo}>+ Novo gerador</button>}
    </section>
    {servicoView && <ServicePanel />} 
    {planejamentoView && <PlanningPanel />}
    {administracao && <AdminPanel podeEditar={usuario.perfil === "administrador"} geradores={geradores} novoGerador={abrirNovo} editarGerador={abrirEdicao} apagarGerador={remover} />}
    {aberto && <div className={styles.modalBackdrop} role="presentation"><section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="form-title"><div className={styles.modalHeader}><div><span className={styles.tableKicker}>DADOS DO ATIVO</span><h2 id="form-title">{editando ? 'Editar gerador' : 'Novo gerador'}</h2></div><button className={styles.closeButton} onClick={() => setAberto(false)} aria-label="Fechar">Ãƒâ€”</button></div><div className={styles.modalPhoto}>{formulario.foto_url ? <Image src={resolverFotoUrl(formulario.foto_url) || ""} alt="PrÃƒÂ©via da foto do gerador" fill sizes="(max-width: 800px) 100vw, 260px" /> : <span>Nenhuma foto selecionada</span>}</div><form className={styles.generatorForm} onSubmit={salvar}>
  <div className={styles.formSection}><h3>GERAL</h3><label>Gerador Local<input value={formulario.gerador_local} onChange={(e) => alterar('gerador_local', e.target.value)} /></label><label>FUEL<input value={formulario.fuel} onChange={(e) => alterar('fuel', e.target.value)} placeholder="NÃƒÂºmero do patrimÃƒÂ´nio" /></label></div>
  <div className={styles.formSection}><h3>ELÃƒâ€°TRICA</h3><label>USCA MODELO<input value={formulario.usca_modelo} onChange={(e) => alterar('usca_modelo', e.target.value)} /></label><label>TENSÃƒÆ’O A.C<input value={formulario.tensao_ac} onChange={(e) => alterar('tensao_ac', e.target.value)} /></label><label>TENSÃƒÆ’O C.C<input value={formulario.tensao_dc} onChange={(e) => alterar('tensao_dc', e.target.value)} /></label><label>CORRENTE<input value={formulario.corrente} onChange={(e) => alterar('corrente', e.target.value)} /></label><label>KVA<input value={formulario.kva} onChange={(e) => alterar('kva', e.target.value)} /></label><label>FABRICADO<input value={formulario.fabricado} onChange={(e) => alterar('fabricado', e.target.value)} /></label></div>
  <div className={styles.formSection}><h3>MECÃƒâ€šNICA</h3><label>FILTRO COMBUSTÃƒÂVEL<input value={formulario.filtro_combustivel} onChange={(e) => alterar('filtro_combustivel', e.target.value)} /></label><label>FILTRO Ãƒâ€œLEO<input value={formulario.filtro_oleo} onChange={(e) => alterar('filtro_oleo', e.target.value)} /></label><label>FILTRO ÃƒÂGUA<input value={formulario.filtro_agua} onChange={(e) => alterar('filtro_agua', e.target.value)} /></label><label>FILTRO DE AR<input value={formulario.filtro_ar} onChange={(e) => alterar('filtro_ar', e.target.value)} /></label></div>
  <div className={styles.formSection}><h3>DADOS DO MOTOR</h3><label>MARCA<input value={formulario.motor_marca} onChange={(e) => alterar('motor_marca', e.target.value)} /></label><label>MODELO<input value={formulario.motor_modelo} onChange={(e) => alterar('motor_modelo', e.target.value)} /></label><label>NÃ‚Âª SÃƒâ€°RIE<input value={formulario.motor_numero_serie} onChange={(e) => alterar('motor_numero_serie', e.target.value)} /></label></div>
  <div className={styles.formSection}><h3>DADOS DO GERADOR</h3><label>MARCA<input value={formulario.gerador_marca} onChange={(e) => alterar('gerador_marca', e.target.value)} /></label><label>MODELO<input value={formulario.gerador_modelo} onChange={(e) => alterar('gerador_modelo', e.target.value)} /></label><label>NÃ‚Âª SÃƒâ€°RIE<input value={formulario.gerador_numero_serie} onChange={(e) => alterar('gerador_numero_serie', e.target.value)} /></label></div>
  <label className={styles.wide}>FOTO DO GERADOR<input type="file" accept="image/*" onChange={selecionarFoto} /></label>
  {erro && <p className={`${styles.feedback} ${styles.wide}`}>{erro}</p>}
  <div className={`${styles.modalActions} ${styles.wide}`}><button type="button" onClick={() => setAberto(false)}>Cancelar</button><button className={styles.primaryButton} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar gerador'}</button></div>
</form></section></div>}
  </main>;
}
