import ReviewForm from '@/components/ReviewForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Dejá tu opinión | Punto Maple',
  description: 'Contanos cómo estuvieron tus huevos frescos de Punto Maple.',
  robots: { index: false, follow: false },
};

export default async function ReseniarPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <ReviewForm code={code} />;
}
