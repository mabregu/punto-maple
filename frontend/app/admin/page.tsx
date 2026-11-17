import AdminPanel from '@/components/AdminPanel';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Panel de operaciones | Punto Maple',
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminPanel />;
}
