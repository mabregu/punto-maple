import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Punto Maple | Huevos Frescos de Granja a Domicilio',
  description:
    'Huevos de gallinas de campo en Punta Lara, entregados frescos en Ensenada, Berisso y La Plata. Envío gratis a partir de 3 maples.',
  keywords: ['huevos frescos', 'Punta Lara', 'Ensenada', 'Berisso', 'La Plata', 'maples', 'delivery'],
  openGraph: {
    title: 'Punto Maple | Del nido a tu puerta, frescos de verdad',
    description: 'Huevos realmente frescos, de producción local, entregados en tu casa.',
    locale: 'es_AR',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="text-gray-800 antialiased min-h-screen flex flex-col justify-between font-sans">
        {children}
      </body>
    </html>
  );
}
