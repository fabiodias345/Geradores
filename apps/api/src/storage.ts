import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const bucket = process.env.STORAGE_BUCKET ?? 'geradores-fotos';
const client = new S3Client({
  endpoint: process.env.STORAGE_ENDPOINT ?? 'http://localhost:9000',
  region: process.env.STORAGE_REGION ?? 'us-east-1',
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY ?? 'geradores',
    secretAccessKey: process.env.STORAGE_SECRET_KEY ?? 'troque-este-valor-local',
  },
});

function decodificarDataUrl(dataUrl: string) {
  const match = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(dataUrl);
  if (!match) return null;
  return { contentType: match[1], body: Buffer.from(match[2], 'base64') };
}

export async function armazenarFoto(dataUrl: string, id: string) {
  const foto = decodificarDataUrl(dataUrl);
  if (!foto) return null;
  const extensao = foto.contentType.split('/')[1].replace('jpeg', 'jpg').replace(/[^a-z0-9]/gi, '');
  const key = `geradores/${id}.${extensao}`;
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: foto.body, ContentType: foto.contentType }));
  return `storage://${key}`;
}

export async function obterFoto(key: string) {
  const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!result.Body) throw new Error('foto não encontrada');
  return { body: Buffer.from(await result.Body.transformToByteArray()), contentType: result.ContentType ?? 'application/octet-stream' };
}

export function chaveFoto(valor: string) {
  return valor.startsWith('storage://') ? valor.slice('storage://'.length) : null;
}
