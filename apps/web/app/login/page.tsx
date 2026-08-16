'use client';

import { FormEvent, useState } from 'react';
import { login } from '../../lib/api';
import styles from './login.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      await login(email, senha);
      window.location.assign('/');
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível entrar');
      setEnviando(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.brand}><span>G</span> geradores<span className={styles.brandEnd}>.</span></div>
        <p className={styles.eyebrow}>HUL · MANUTENÇÃO</p>
        <h1 className={styles.title}>Entrar no painel<span>.</span></h1>
        <p className={styles.copy}>Acesse o ambiente de operação e manutenção dos geradores.</p>
        <form onSubmit={handleSubmit}>
          <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
          <label>Senha<input type="password" value={senha} onChange={(event) => setSenha(event.target.value)} autoComplete="current-password" required /></label>
          {erro && <p className={styles.error} role="alert">{erro}</p>}
          <button disabled={enviando}>{enviando ? 'Entrando...' : 'Entrar no painel →'}</button>
        </form>
        <small className={styles.environment}>ambiente local · Docker</small>
      </section>
    </main>
  );
}
