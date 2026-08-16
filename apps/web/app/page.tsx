'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';
import { getSession, logout, type UsuarioSessao } from '../lib/api';

const modules = [
  ['Geradores', 'Cadastro dos ativos e dados técnicos'],
  ['Ordens de serviço', 'Abertura, execução e fechamento'],
  ['Agenda', 'Preventivas programadas e pendências'],
];

export default function HomePage() {
  const [usuario, setUsuario] = useState<UsuarioSessao | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    getSession().then(({ usuario: atual }) => setUsuario(atual)).catch(() => window.location.assign('/login')).finally(() => setCarregando(false));
  }, []);

  async function sair() {
    await logout();
    window.location.assign('/login');
  }

  if (carregando) return <main className={styles.loadingScreen}>Validando sessão...</main>;
  if (!usuario) return null;

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">G</span> geradores<span className="brand-dot">.</span></div>
        <div className="site-chip"><span /> HUL · manutenção</div>
        <nav aria-label="Navegação principal">
          <p>OPERAÇÃO</p><a className="active" href="#inicio">Visão geral</a><a href="#geradores">Geradores</a><a href="#ordens">Ordens de serviço</a><a href="#agenda">Agenda</a>
          <p className="nav-section">SISTEMA</p><a href="#telemetria">Telemetria <small>futuro</small></a>
        </nav>
        <div className="sidebar-foot"><strong>{usuario.nome}</strong><span>{usuario.perfil} · <button className={styles.logoutButton} onClick={sair}>sair</button></span></div>
      </aside>

      <section className="content" id="inicio">
        <header className="topbar"><span>HUL / Operação</span><span className="status"><i /> {usuario.email}</span></header>
        <div className="hero">
          <div><p className="eyebrow">PAINEL DE OPERAÇÃO</p><h1>Base do sistema<span>.</span></h1><p className="lead">A fundação local está pronta para receber os dados reais de manutenção.</p></div>
          <div className="phase-card"><span>FASE ATUAL</span><strong>03</strong><small>Autenticação conectada</small></div>
        </div>
        <section className="notice"><span className="notice-icon">◌</span><div><strong>Ambiente sem dados operacionais</strong><p>O cadastro de geradores e as ordens de serviço serão habilitados nas próximas fases.</p></div></section>
        <section className="module-grid" aria-label="Módulos planejados">
          {modules.map(([title, description], index) => <article className="module-card" key={title}><span className="module-index">0{index + 1}</span><h2>{title}</h2><p>{description}</p><span className="planned">planejado <b>→</b></span></article>)}
        </section>
      </section>
    </main>
  );
}
