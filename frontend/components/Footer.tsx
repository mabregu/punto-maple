export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-6 border-t border-gray-800 text-center text-xs">
      <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🥚</span>
          <span className="font-bold">Punto Maple</span>
          <span className="text-gray-400">· Punta Lara, Ensenada</span>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-gray-400">Huevos frescos de producción propia y flete en auto.</p>
          <a href="/admin" className="text-gray-500 hover:text-amber-400 underline">
            Panel interno
          </a>
        </div>
      </div>
    </footer>
  );
}
