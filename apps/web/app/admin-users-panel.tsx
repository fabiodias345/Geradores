'use client';

import { FormEvent, useEffect, useState } from 'react';
import styles from './admin-panel.module.css';
import { atualizarAdministrador, criarAdministrador, desativarAdministrador, listarAdministradores, type Administrador, type AdministradorInput } from '../lib/api';

const vazio: AdministradorInput = { nome: '', email: '', senha: '' };

export default function AdminUsersPanel() {
  const [usuarios, setUsuarios] = useState<Administrador[]>([]);
  const [formulario, setFormulario] = useState(vazio);
  const [editando, setEditando] = useState<Administrador | null>(null);
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  async function carregar() { setUsuarios((await listarAdministradores()).administradores); }
  useEffect(() => { carregar().catch((error) => setErro(error instanceof Error ? error.message : 'Não foi possível carregar os administradores')); }, []);
  function alterar(campo: keyof AdministradorInput, valor: string) { setFormulario((atual) => ({ ...atual, [campo]: valor })); }
  function novo() { setEditando(null); setFormulario(vazio); setErro(''); setAberto(true); }
  function editar(usuario: Administrador) { setEditando(usuario); setFormulario({ nome: usuario.nome, email: usuario.email, senha: '' }); setErro(''); setAberto(true); }
  async function salvar(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSalvando(true); setErro(''); try { if (editando) await atualizarAdministrador(editando.id, { ...formulario, senha: formulario.senha || undefined }); else await criarAdministrador(formulario); await carregar(); setAberto(false); } catch (error) { setErro(error instanceof Error ? error.message : 'Não foi possível salvar o administrador'); } finally { setSalvando(false); } }
  async function apagar(usuario: Administrador) { if (!window.confirm(`Inativar ${usuario.nome}?`)) return; try { await desativarAdministrador(usuario.id); await carregar(); } catch (error) { setErro(error instanceof Error ? error.message : 'Não foi possível inativar o administrador'); } }
  return <div><div className={styles.toolbar}><div><h2>Administradores</h2><span>{usuarios.length} registro(s)</span></div><button className={styles.primary} onClick={novo}>+ Novo administrador</button></div>{erro && <p className={styles.error}>{erro}</p>}<div className={styles.tableWrap}><table><thead><tr><th>Nome</th><th>E-mail</th><th>Status</th><th /></tr></thead><tbody>{usuarios.map((usuario) => <tr key={usuario.id}><td><strong>{usuario.nome}</strong></td><td>{usuario.email}</td><td><span className={usuario.ativo ? styles.activeStatus : styles.inactiveStatus}>{usuario.ativo ? 'Ativo' : 'Inativo'}</span></td><td className={styles.actions}><button onClick={() => editar(usuario)}>Editar</button><button onClick={() => apagar(usuario)}>Apagar</button></td></tr>)}</tbody></table>{!usuarios.length && <div className={styles.empty}>Nenhum administrador cadastrado.</div>}</div>{aberto && <div className={styles.backdrop}><section className={styles.modal}><header><div><span>ADMINISTRADOR</span><h2>{editando ? 'Editar administrador' : 'Novo administrador'}</h2></div><button onClick={() => setAberto(false)}>×</button></header><form onSubmit={salvar}><label>Nome<input required value={formulario.nome} onChange={(e) => alterar('nome', e.target.value)} /></label><label>E-mail institucional<input required type="email" value={formulario.email} onChange={(e) => alterar('email', e.target.value)} placeholder="nome@uel.br" /></label><label>Senha<input required={!editando} type="password" value={formulario.senha} onChange={(e) => alterar('senha', e.target.value)} minLength={8} pattern="(?=.*[A-Za-z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}" title="Use no mínimo 8 caracteres, com letra, número e caractere especial" placeholder={editando ? 'Deixe em branco para manter' : 'Mínimo: 8, letra, número e especial'} /></label>{erro && <p className={styles.error}>{erro}</p>}<footer><button type="button" onClick={() => setAberto(false)}>Cancelar</button><button className={styles.primary} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar administrador'}</button></footer></form></section></div>}</div>;
}
