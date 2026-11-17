export default function Hero() {
  return (
    <section className="max-w-5xl mx-auto px-4 pt-8 pb-6 sm:py-10 text-center">
      <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 text-xs sm:text-sm font-semibold px-3 py-1 rounded-full mb-4">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        Recolección de Granja Propia en Punta Lara
      </div>
      <h2 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight max-w-2xl mx-auto leading-tight">
        Huevos realmente frescos, del nido a tu cocina.
      </h2>
      <p className="mt-3 text-sm sm:text-lg text-gray-600 max-w-xl mx-auto">
        Sin intermediarios ni semanas en góndolas. Entregas directas en auto por{' '}
        <strong>Ensenada, Berisso y La Plata</strong>.
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs font-medium text-gray-700">
        <span className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5">
          🌿 <span>100% Frescura Garantizada</span>
        </span>
        <span className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5">
          🚗 <span>Cuidado en Mano (Sin Golpes)</span>
        </span>
        <span className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5">
          💵 <span>Efectivo o Transferencia</span>
        </span>
      </div>
    </section>
  );
}
