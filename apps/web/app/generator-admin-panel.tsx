'use client';
import type { Gerador } from '../lib/api';
import { resolverFotoUrl } from '../lib/api';
import styles from './admin-panel.module.css';

type Props = { geradores: Gerador[]; podeEditar: boolean; novo: () => void; editar: (gerador: Gerador) => void; apagar: (gerador: Gerador) => void };

export default function GeneratorAdminPanel({ geradores, podeEditar, novo, editar, apagar }: Props) {
  return <div>
    <div className={styles.toolbar}>
      <div><h2>Geradores cadastrados</h2><span>{geradores.length} equipamento(s)</span></div>
      {podeEditar && <button className={styles.primary} onClick={novo}>+ Novo gerador</button>}
    </div>
    <div className={styles.tableWrap}>
      <table className={styles.generatorTable}>
        <thead><tr><th>Foto</th><th>Local</th><th>KVA</th><th>Corrente</th><th>FUEL</th><th>A??es</th></tr></thead>
        <tbody>{geradores.map((gerador) => {
          const foto = resolverFotoUrl(gerador.foto_url);
          return <tr key={gerador.id}>
            <td><div className={styles.generatorThumb}>{foto ? <img src={foto} alt={`Foto de ${gerador.identificacao}`} /> : <span>G</span>}</div></td>
            <td><strong>{gerador.identificacao}</strong><small>{gerador.localizacao}</small></td>
            <td>{gerador.dados_tecnicos?.kva || (gerador.potencia_kva ? gerador.potencia_kva + ' kVA' : '-')}</td>
            <td>{gerador.dados_tecnicos?.corrente || '-'}</td>
            <td>{gerador.dados_tecnicos?.fuel || '-'}</td>
            <td className={styles.actions}>{podeEditar && <><button onClick={() => editar(gerador)}>Editar</button><button onClick={() => apagar(gerador)}>Apagar</button></>}</td>
          </tr>;
        })}</tbody>
      </table>
      {!geradores.length && <div className={styles.empty}>Nenhum gerador cadastrado.</div>}
    </div>
  </div>;
}
