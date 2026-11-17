export default function HowItWorks() {
  return (
    <section className="bg-white border-t border-amber-100 py-10">
      <div className="max-w-5xl mx-auto px-4">
        <h3 className="text-center text-xl font-extrabold text-gray-900 mb-8">
          ¿Cómo funciona la entrega de Punto Maple?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-200 flex items-center justify-center text-2xl mb-3">
              1️⃣
            </div>
            <h4 className="font-bold text-gray-900">Armás tu pedido</h4>
            <p className="text-xs text-gray-600 mt-1">
              Elegís maples o docenas. Recordá que con 3 maples el envío es gratis.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-200 flex items-center justify-center text-2xl mb-3">
              2️⃣
            </div>
            <h4 className="font-bold text-gray-900">Confirmación por WhatsApp</h4>
            <p className="text-xs text-gray-600 mt-1">
              Al finalizar, se abre tu WhatsApp con el resumen y el código de pedido listos para enviar.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-200 flex items-center justify-center text-2xl mb-3">
              3️⃣
            </div>
            <h4 className="font-bold text-gray-900">Entrega en tu puerta</h4>
            <p className="text-xs text-gray-600 mt-1">
              Llegamos en auto particular con los maples cuidados. Pagás al recibir o por transferencia.
            </p>
          </div>
        </div>

        <div className="mt-8 p-4 rounded-2xl bg-gray-50 border border-gray-200 max-w-3xl mx-auto text-xs sm:text-sm">
          <p className="font-bold text-gray-800 mb-2 text-center text-sm">📅 Días de reparto programado:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-600">
            <div className="flex items-start gap-2">
              <span className="text-amber-500 font-bold">●</span>
              <div>
                <strong>Lunes y Jueves:</strong> Ensenada (todos los barrios) y Berisso (Centro, Villa Zula, Barrio Obrero).
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-500 font-bold">●</span>
              <div>
                <strong>Martes y Viernes:</strong> La Plata (Casco Urbano, Tolosa, Ringuelet, Gonnet y City Bell).
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
