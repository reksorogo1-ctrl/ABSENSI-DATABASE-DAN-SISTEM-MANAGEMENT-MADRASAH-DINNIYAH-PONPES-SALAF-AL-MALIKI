import React, { useState } from 'react';
import { Download, Smartphone, X, Share2, PlusSquare } from 'lucide-react';
import { usePWAInstall } from '../usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'button' | 'banner' | 'compact';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState<boolean>(false);
  const [isInstalling, setIsInstalling] = useState<boolean>(false);

  // If already installed in standalone mode, suppress completely
  if (isInstalled) {
    return null;
  }

  // If not installable and not iOS, don't show
  if (!isInstallable) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    setIsInstalling(true);
    try {
      await install();
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <>
      {variant === 'banner' ? (
        <div
          className={`flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-[#031d11]/95 to-[#0b2918]/95 border border-[#d4af37]/40 shadow-xl ${className}`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white text-gold-3d">
                Instal Aplikasi SIM Al-Maliki
              </p>
              <p className="text-[11px] text-emerald-300">
                Akses instan, ringan, responsif & bekerja luring
              </p>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            disabled={isInstalling}
            className="btn-3d-gold flex items-center space-x-1.5 text-black font-extrabold text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isInstalling ? 'Memasang...' : 'Instal Aplikasi'}</span>
          </button>
        </div>
      ) : variant === 'button' ? (
        <button
          onClick={handleInstallClick}
          disabled={isInstalling}
          className={`btn-3d-gold flex items-center space-x-1.5 text-black font-extrabold text-xs ${className}`}
          title="Instal Aplikasi SIM Salaf Al-Maliki ke Perangkat"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isInstalling ? 'Memasang...' : 'Instal Web App'}</span>
        </button>
      ) : (
        <button
          onClick={handleInstallClick}
          disabled={isInstalling}
          className={`btn-3d-gold flex items-center space-x-1 text-black font-bold text-[11px] px-2.5 py-1.5 ${className}`}
          title="Instal Aplikasi ke HP/Desktop"
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">Instal App</span>
          <span className="sm:hidden">Instal</span>
        </button>
      )}

      {/* iOS Safari Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="card-3d-glass rounded-3xl p-6 max-w-sm w-full space-y-4 border border-[#d4af37]/50 text-center relative">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white bg-black/40 border border-white/10"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
              <Smartphone className="w-7 h-7" />
            </div>

            <h3 className="text-base font-bold text-white text-gold-3d">
              Cara Instal di iPhone / iPad
            </h3>

            <div className="space-y-3 text-xs text-slate-200 text-left bg-black/30 p-3.5 rounded-xl border border-white/10">
              <div className="flex items-start space-x-2.5">
                <span className="font-bold text-[#d4af37]">1.</span>
                <p>
                  Ketuk ikon <strong className="text-white">Bagikan (Share)</strong>{' '}
                  <Share2 className="w-3.5 h-3.5 inline mx-1 text-sky-400" /> di menu browser Safari.
                </p>
              </div>
              <div className="flex items-start space-x-2.5">
                <span className="font-bold text-[#d4af37]">2.</span>
                <p>
                  Gulir ke bawah dan pilih{' '}
                  <strong className="text-white">Tambahkan ke Layar Utama</strong>{' '}
                  <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-emerald-400" />.
                </p>
              </div>
              <div className="flex items-start space-x-2.5">
                <span className="font-bold text-[#d4af37]">3.</span>
                <p>
                  Ketuk <strong className="text-white">Tambah (Add)</strong> di pojok kanan atas.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full btn-3d-gold text-black font-bold text-xs py-2"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
};
