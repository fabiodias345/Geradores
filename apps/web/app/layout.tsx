import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Geradores HUL',
  description: 'Gestão operacional e manutenção dos geradores do HUL',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
