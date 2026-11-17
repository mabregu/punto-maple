interface Props {
  totalMaples: number;
  threshold: number;
  isFreeShipping: boolean;
}

export default function PromoTracker({ totalMaples, threshold, isFreeShipping }: Props) {
  const percent = Math.min(100, Math.round((totalMaples / threshold) * 100));
  const remaining = Math.max(0, +(threshold - totalMaples).toFixed(1));
  const formatted = Number.isInteger(remaining) ? remaining : remaining.toFixed(1);

  return (
    <div className="max-w-5xl mx-auto px-4 mb-6">
      <div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📦</span>
          <div>
            <p className="text-sm font-bold text-gray-900" id="promo-text">
              {isFreeShipping ? (
                <>🎉 <strong>¡Tenés ENVÍO GRATIS asegurado!</strong> (Alcanzaste {totalMaples.toFixed(1)} maples)</>
              ) : (
                <>Agregá <strong>{formatted} maple(s) más</strong> para tener <strong>ENVÍO GRATIS</strong></>
              )}
            </p>
            <p className="text-xs text-gray-500">Juntate con un vecino, familiar o compañero y ahorrá el flete.</p>
          </div>
        </div>
        <div className="w-full sm:w-48 bg-gray-100 rounded-full h-3 overflow-hidden border border-gray-200">
          <div
            id="promo-progress-bar"
            className={`h-3 transition-all duration-300 ${isFreeShipping ? 'bg-emerald-500' : 'bg-amber-500'}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
