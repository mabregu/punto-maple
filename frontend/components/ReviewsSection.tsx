interface Review {
  rating: number;
  comment: string | null;
  customerName: string | null;
  tags: string[];
}

export default function ReviewsSection({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;

  const average = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;

  return (
    <section className="max-w-5xl mx-auto px-4 pb-10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900">Lo que dicen nuestros vecinos</h3>
        <span className="text-sm font-black text-amber-600">
          ⭐ {average.toFixed(1)} / 5 ({reviews.length})
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reviews.slice(0, 6).map((review, i) => (
          <div key={i} className="bg-white rounded-2xl border border-amber-100 p-4 shadow-sm">
            <div className="text-amber-500 text-sm mb-1">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
            <p className="text-xs text-gray-700">{review.comment || 'Muy buenos huevos, ¡gracias!'}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {review.tags?.map((tag) => (
                <span key={tag} className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-2">Compra verificada · {review.customerName || 'Vecino'}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
