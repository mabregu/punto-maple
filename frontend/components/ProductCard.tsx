import type { Product } from '@/lib/types';

interface Props {
  product: Product;
  onAdd: (id: string) => void;
}

export default function ProductCard({ product, onAdd }: Props) {
  const isFreeBadge = product.badge?.includes('Gratis');

  return (
    <div className="glass-card bg-white rounded-2xl border border-amber-100 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between relative overflow-hidden">
      {product.badge && (
        <span
          className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
            isFreeBadge ? 'bg-emerald-500 text-white animate-pulse' : 'bg-amber-100 text-amber-800'
          }`}
        >
          {product.badge}
        </span>
      )}

      <div className="pr-14 sm:pr-20">
        <div className="text-4xl mb-3">{product.icon}</div>
        <h4 className="font-bold text-gray-900 text-base leading-tight">{product.name}</h4>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{product.description}</p>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <span className="text-xs text-gray-400 block">{product.unitText}</span>
          <span className="text-lg sm:text-xl font-extrabold text-gray-900">
            ${product.priceArs.toLocaleString('es-AR')}
          </span>
        </div>
        <button
          onClick={() => onAdd(product.id)}
          className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-3 sm:py-2 rounded-xl text-sm sm:text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition shrink-0"
        >
          <span>+ Agregar</span>
        </button>
      </div>
    </div>
  );
}
