'use client';

import Image from 'next/image';
import { FormEvent, useState } from 'react';
import { login } from '../../lib/api';
import styles from './login.module.css';

export default function LoginPage() {
  const [identificador, setIdentificador] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      await login(identificador, senha);
      window.location.assign('/');
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível entrar');
      setEnviando(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.accessPanel} aria-label="Acesso ao painel">
        <div className={styles.accessInner}>
          <header className={styles.header}>
            <div className={styles.logoMark}>G</div>
            <div className={styles.logoWord}>geradores<span>.</span></div>
            <span className={styles.headerTag}>HUL</span>
          </header>
          <div className={styles.intro}>
            <p className={styles.kicker}>ACESSO RESTRITO · HUL</p>
            <h1>Energia sob<br /><em>controle.</em></h1>
            <p className={styles.description}>Geradores, manutenção e alertas em um só lugar.</p>
          </div>
          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.field}><span>Login ou e-mail institucional</span><input type="text" value={identificador} onChange={(event) => setIdentificador(event.target.value)} autoComplete="username" placeholder="seu.login ou nome@uel.br" required /></label>
            <label className={styles.field}><span>Senha</span><input type="password" value={senha} onChange={(event) => setSenha(event.target.value)} autoComplete="current-password" placeholder="Digite sua senha" required /></label>
            {erro && <p className={styles.error} role="alert">{erro}</p>}
            <button className={styles.submit} disabled={enviando} type="submit"><span>{enviando ? 'Validando acesso' : 'Acessar painel'}</span><b>↗</b></button>
          </form>
          <footer className={styles.footer}><span>HUL · Supervisório</span><span>Ambiente protegido</span></footer>
        </div>
      </section>
      <aside className={styles.visualPanel} aria-label="Supervisório de geradores">
        <Image className={styles.heroImage} src="/gerador-hul.png" alt="Gerador do Hospital Universitário de Londrina" fill priority sizes="(max-width: 900px) 100vw, 57vw" />
        <div className={styles.imageShade} />
        <div className={styles.visualTop}><span className={styles.liveDot} /> OPERAÇÃO ONLINE</div>
        <div className={styles.visualCopy}><p>Prevenir.<br /><strong>Monitorar.</strong></p><span>supervisão de geradores.</span></div>
      </aside>
    </main>
  );
}
