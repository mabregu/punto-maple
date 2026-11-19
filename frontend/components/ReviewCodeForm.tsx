'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ReviewCodeForm() {
  const router = useRouter();
  const [code, setCode] = useState('');

  const submit = () => {
    const clean = code.trim().toUpperCase();
    if (clean) router.push(`/reseniar/${encodeURIComponent(clean)}`);
  };

  return (
    <main className="min-h-screen bg-amber-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl border border-amber-100 shadow-lg p-6 sm:p-8 w-full max-w-md text-center">
        <div className="text-4xl mb-3">🥚</div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">¿Ya probaste tus huevos?</h1>
        <p className="text-sm text-gray-600 mb-6">
          Ingresá el código de tu pedido (te lo enviamos por WhatsApp) para dejar tu opinión.
        </p>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="PM-20261119-XXXX"
          className="w-full text-base p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:outline-none uppercase"
        />
        <button
          onClick={submit}
          disabled={!code.trim()}
          className="w-full mt-3 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white font-bold py-3.5 rounded-xl"
        >
          Continuar
        </button>
        <p className="text-center mt-5">
          <a href="/" className="text-xs text-gray-500 hover:text-amber-600 underline">
            Volver a la tienda
          </a>
        </p>
      </div>
    </main>
  );
}
