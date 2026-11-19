'use client';

import { useEffect, useState } from 'react';
import { fetchOrder, submitReview } from '@/lib/api';

const TAGS = ['Frescura', 'Puntualidad', 'Presentación', 'Sabor', 'Atención'];

export default function ReviewForm({ code }: { code: string }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderInfo, setOrderInfo] = useState<string>('');

  useEffect(() => {
    fetchOrder(code).then((order) => {
      if (order) {
        setOrderInfo(`${order.totalArs.toLocaleString('es-AR')} · ${order.status}`);
      }
    });
  }, [code]);

  const toggleTag = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Elegí una calificación con las estrellas.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await submitReview({
        orderCode: code,
        rating,
        tags,
        comment: comment.trim(),
        photoUrl: photoUrl.trim(),
      });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ocurrió un error inesperado.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <main className="min-h-screen bg-amber-50 flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-2xl border border-amber-100 shadow-lg p-8 w-full max-w-md text-center">
          <div className="text-5xl mb-4">🥚</div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">¡Muchas gracias!</h1>
          <p className="text-sm text-gray-600 mb-6">
            Tu opinión quedó registrada. La publicaremos en la tienda después de revisarla.
          </p>
          <a href="/" className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-xl">
            Volver a la tienda
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-amber-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl border border-amber-100 shadow-lg p-6 sm:p-8 w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🥚</div>
          <h1 className="text-2xl font-black text-gray-900">¿Cómo estuvieron tus huevos?</h1>
          <p className="text-xs text-gray-500 mt-2">
            Pedido <strong>{code}</strong>{orderInfo ? ` · ${orderInfo}` : ''}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Tu opinión ayuda a otros vecinos de Ensenada, Berisso y La Plata.
          </p>
        </div>

        <div className="mb-6 text-center">
          <div className="flex justify-center gap-2" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHover(star)}
                onClick={() => setRating(star)}
                aria-label={`${star} estrella${star > 1 ? 's' : ''}`}
                className={`text-4xl leading-none transition-transform hover:scale-110 ${
                  star <= (hover || rating) ? 'text-amber-500' : 'text-gray-300'
                }`}
              >
                ★
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2 h-4">
            {rating > 0 ? `${rating} de 5` : 'Tocá una estrella para calificar'}
          </p>
        </div>

        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
            ¿Qué destacás? (opcional)
          </p>
          <div className="flex flex-wrap gap-2">
            {TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition ${
                  tags.includes(tag)
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-amber-400'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-2">
            Contanos un poco más (opcional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Ej: llegaron fresquísimos y sin romperse. El repartidor fue muy amable."
            className="w-full text-sm p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none"
          />
        </div>

        <div className="mb-6">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-2">
            Link a una foto (opcional)
          </label>
          <input
            type="url"
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
            placeholder="https://..."
            className="w-full text-sm p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting || rating === 0}
          className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white font-extrabold py-3 rounded-xl transition active:scale-95"
        >
          {submitting ? 'Enviando…' : 'Enviar mi opinión'}
        </button>
        <p className="text-[10px] text-gray-400 text-center mt-3">
         Tu reseña se publica después de que la revisemos.
        </p>
      </div>
    </main>
  );
}
