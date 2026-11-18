import OrderStatus from '@/components/OrderStatus';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Estado del pedido | Punto Maple',
  robots: { index: false, follow: false },
};

export default async function PedidoPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { code } = await params;
  const { status } = await searchParams;
  return <OrderStatus code={code} initialStatus={status} />;
}
