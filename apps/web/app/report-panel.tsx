'use client';

import { useState } from 'react';
import styles from './admin-panel.module.css';

export default function ReportPanel() {
  const [mes, setMes] = useState('8');
  const [ano, setAno] = useState(String(new Date().getFullYear()));
  const [tipo, setTipo] = useState('ambos');
  const [status, setStatus] = useState('todas');

  return <section className={styles.reportPanel}><p className="eyebrow">RELATÓRIO MENSAL</p><div className={styles.reportFilters}><label>Mês<input type="number" min="1" max="12" value={mes} onChange={(event) => setMes(event.target.value)} /></label><label>Ano<input type="number" min="2020" value={ano} onChange={(event) => setAno(event.target.value)} /></label><label>Gerador<select defaultValue="todos"><option value="todos">Todos</option></select></label><label>Tipo<select value={tipo} onChange={(event) => setTipo(event.target.value)}><option value="corretiva">Corretiva</option><option value="preventiva">Preventiva</option><option value="ambos">Ambos</option></select></label><label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="abertas">Abertas</option><option value="execucao">Em execução</option><option value="fechadas">Fechadas</option><option value="todas">Todas</option></select></label></div><button className={styles.generateReport}>Gerar relatório</button><div className={styles.reportStats}>{['Serviços', 'Concluídos', 'Preventivas', 'Corretivas', 'Geradores atendidos', 'Horas', 'Custo'].map((titulo, index) => <article key={titulo}><span>{titulo}</span><strong>{index === 6 ? 'R$ 0,00' : '0'}</strong></article>)}</div><div className={styles.reportEmpty}>Nenhum resultado para os filtros.</div></section>;
}
