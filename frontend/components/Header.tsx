'use client';

interface Props {
  cartCount: number;
  onOpenCart: () => void;
}

export default function Header({ cartCount, onOpenCart }: Props) {
  return (
    <>
      <div className="bg-amber-500 text-white text-xs sm:text-sm font-semibold py-2 px-4 text-center tracking-wide shadow-sm flex items-center justify-center gap-2">
        <span>🚚</span>
        <span>
          <strong>¡ENVÍO GRATIS</strong> en Ensenada, Berisso y La Plata a partir de <strong>3 maples</strong>!
        </span>
      </div>

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-500 flex items-center justify-center text-2xl shadow-md shadow-amber-200">
              🥚
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight tracking-tight flex items-center gap-1">
                Punto <span className="text-amber-600">Maple</span>
              </h1>
              <p className="text-xs text-gray-500 font-medium">De Punta Lara a tu mesa</p>
            </div>
          </div>

          <button
            onClick={onOpenCart}
            className="relative bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm transition active:scale-95"
            aria-label="Abrir carrito"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="hidden sm:inline">Tu Pedido</span>
            <span id="nav-cart-count" className="bg-white text-amber-600 text-xs font-black px-2 py-0.5 rounded-full">
              {cartCount}
            </span>
          </button>
        </div>
      </header>
    </>
  );
}
