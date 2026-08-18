import nodemailer from 'nodemailer';
import { pool } from './db.js';

export async function enviarLembretesPlanejamento() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_FROM) return;
  const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT ?? 587), secure: process.env.SMTP_SECURE === 'true', auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD ?? '' } : undefined });
  const result = await pool.query(`select p.id,p.empresa_nome,p.empresa_email,p.proxima_data,g.identificacao from planejamento_preventivo p join gerador g on g.id=p.gerador_id where p.ativo=true and p.lembrete_enviado_em is null and p.proxima_data - interval '1 month' <= current_date and p.proxima_data >= current_date`);
  for (const plano of result.rows) {
    await transporter.sendMail({ from: process.env.SMTP_FROM, to: plano.empresa_email, subject: `Manutenção preventiva do ${plano.identificacao}`, text: `Olá, ${plano.empresa_nome}. Informamos que a manutenção preventiva do ${plano.identificacao} está prevista para ${new Date(plano.proxima_data).toLocaleDateString('pt-BR')}. A troca de óleo e filtros está programada${process.env.BATTERY_NOTICE ?? ' e a bateria será verificada conforme a periodicidade cadastrada'}.` });
    await pool.query('update planejamento_preventivo set lembrete_enviado_em=now() where id=$1', [plano.id]);
  }
}