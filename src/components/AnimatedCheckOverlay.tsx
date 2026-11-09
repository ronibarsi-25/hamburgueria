import React, { useEffect } from 'react';
import { ChefHat, Bike, Utensils, Sparkles, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AnimatedCheckOverlayProps {
  orderDisplayNumber: number;
  status: 'PRONTO' | 'ENTREGUE';
  tableNumber?: string;
  type?: 'mesa' | 'delivery' | 'balcao';
  onClose: () => void;
}

export const AnimatedCheckOverlay: React.FC<AnimatedCheckOverlayProps> = ({
  orderDisplayNumber,
  status,
  tableNumber,
  type,
  onClose,
}) => {
  useEffect(() => {
    // Confetti burst for celebration
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.5 },
        colors: status === 'PRONTO' ? ['#10b981', '#34d399', '#f59e0b'] : ['#f59e0b', '#fbbf24', '#3b82f6'],
      });
    } catch {
      // Ignore
    }

    // Auto dismiss after 2.8 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 2800);

    return () => clearTimeout(timer);
  }, [status, onClose]);

  const isPronto = status === 'PRONTO';

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm cursor-pointer select-none animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative max-w-sm w-full p-8 rounded-3xl border text-center shadow-2xl transition-all transform scale-100 animate-in zoom-in-90 duration-300 ${
          isPronto
            ? 'bg-gradient-to-b from-stone-900 via-stone-950 to-emerald-950/40 border-emerald-500/40 shadow-emerald-500/20'
            : 'bg-gradient-to-b from-stone-900 via-stone-950 to-amber-950/40 border-amber-500/40 shadow-amber-500/20'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-200 p-1 rounded-full hover:bg-stone-800"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Animated Check SVG with stroke-dashoffset animation */}
        <div className="relative w-28 h-28 mx-auto mb-5 flex items-center justify-center">
          {/* Pulsing Outer Glow Ring */}
          <div
            className={`absolute inset-0 rounded-full animate-ping opacity-25 ${
              isPronto ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          />
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center shadow-lg border-2 ${
              isPronto
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400 shadow-emerald-500/30'
                : 'bg-amber-500/20 border-amber-400 text-amber-400 shadow-amber-500/30'
            }`}
          >
            <svg
              className="w-14 h-14"
              viewBox="0 0 52 52"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="26"
                cy="26"
                r="23"
                stroke="currentColor"
                strokeWidth="2.5"
                className="opacity-40"
              />
              <path
                d="M14 27L22 35L38 18"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-[dash_0.6s_cubic-bezier(0.65,0,0.45,1)_forwards]"
                style={{
                  strokeDasharray: 50,
                  strokeDashoffset: 0,
                  animation: 'drawCheck 0.5s ease-in-out forwards',
                }}
              />
            </svg>
          </div>

          <style>{`
            @keyframes drawCheck {
              0% { stroke-dashoffset: 50; }
              100% { stroke-dashoffset: 0; }
            }
          `}</style>
        </div>

        {/* Status Badge & Title */}
        <div className="space-y-2">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
              isPronto
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isPronto ? 'Status: Pronto p/ Servir' : 'Status: Entregue ao Cliente'}</span>
          </div>

          <h2 className="text-2xl font-black text-stone-100">
            Pedido #{orderDisplayNumber}
          </h2>

          <p className="text-sm text-stone-300 font-semibold">
            {tableNumber ? (
              <span className="text-amber-400 font-bold">MESA {tableNumber}</span>
            ) : type === 'delivery' ? (
              <span className="text-blue-400 font-bold">DELIVERY ONLINE</span>
            ) : (
              <span className="text-emerald-400 font-bold">VENDA BALCÃO</span>
            )}
          </p>

          <p className="text-xs text-stone-400 mt-2">
            {isPronto
              ? 'Burger e itens finalizados pela cozinha! Pronto para o garçom ou motoboy levar.'
              : 'Comanda finalizada com sucesso. Mesa liberada ou entrega concluída.'}
          </p>
        </div>

        {/* Tap to dismiss hint */}
        <div className="mt-6 pt-4 border-t border-stone-800 text-[11px] text-stone-400 font-medium">
          Clique em qualquer lugar para fechar
        </div>
      </div>
    </div>
  );
};
