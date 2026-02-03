import { useState, useEffect, useRef } from 'react';
import { validateKillCode, getKillCode } from '../../services/storage/settingsStorage';

const MAX_ATTEMPTS = 3;

export default function KillSwitchModal({ isOpen, onClose, onSuccess }) {
  const [code, setCode] = useState(['', '', '', '']);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (isOpen) {
      setCode(['', '', '', '']);
      setAttempts(0);
      setError(false);
      // Focus first input
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleDigitPress = (digit) => {
    const emptyIndex = code.findIndex(d => d === '');
    if (emptyIndex === -1) return;

    const newCode = [...code];
    newCode[emptyIndex] = digit;
    setCode(newCode);
    setError(false);

    // Check if code is complete
    if (emptyIndex === 3) {
      const enteredCode = [...newCode].join('');
      validateCode(enteredCode);
    }
  };

  const handleBackspace = () => {
    const lastFilledIndex = code.map((d, i) => d !== '' ? i : -1).filter(i => i !== -1).pop();
    if (lastFilledIndex !== undefined) {
      const newCode = [...code];
      newCode[lastFilledIndex] = '';
      setCode(newCode);
      setError(false);
    }
  };

  const validateCode = (enteredCode) => {
    const hasKillCode = getKillCode() !== null;

    if (!hasKillCode) {
      // No kill code set - any code works (emergency bypass)
      onSuccess?.();
      return;
    }

    if (validateKillCode(enteredCode)) {
      onSuccess?.();
    } else {
      setAttempts(prev => prev + 1);
      setError(true);
      setIsShaking(true);

      setTimeout(() => {
        setIsShaking(false);
        setCode(['', '', '', '']);

        if (attempts + 1 >= MAX_ATTEMPTS) {
          // Max attempts reached
          setTimeout(() => {
            onClose?.();
          }, 500);
        }
      }, 500);
    }
  };

  if (!isOpen) return null;

  const remainingAttempts = MAX_ATTEMPTS - attempts;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`relative w-full max-w-sm mx-4 bg-[#0D0D0D] rounded-3xl overflow-hidden border border-[#1A1A1A] ${isShaking ? 'animate-shake' : ''}`}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1A1A1A] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#F1F1F1]">Kill Switch</h2>
          <button
            onClick={onClose}
            className="p-2 text-[#636363] hover:text-[#F1F1F1] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <p className="text-[#636363] text-center mb-6">
            Enter your 4-digit code
          </p>

          {/* Code display - improved design */}
          <div className={`flex justify-center items-center gap-4 py-6 ${isShaking ? 'animate-shake' : ''}`}>
            {code.map((digit, index) => (
              <div
                key={index}
                className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center text-3xl font-bold transition-all ${
                  error
                    ? 'border-[#EF4444] bg-[#EF4444]/10 text-[#EF4444]'
                    : digit
                    ? 'border-[#10B981] bg-[#10B981]/10 text-white'
                    : 'border-[#222222] bg-[#0A0A0A] text-[#636363]'
                }`}
              >
                {digit ? '•' : ''}
              </div>
            ))}
          </div>

          {/* Error message */}
          {error && (
            <p className="text-[#EF4444] text-center text-sm mb-4">
              Wrong code. {remainingAttempts} {remainingAttempts === 1 ? 'attempt' : 'attempts'} remaining.
            </p>
          )}

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleDigitPress(num.toString())}
                className="h-16 rounded-2xl bg-[#161616] text-[#F1F1F1] text-2xl font-semibold hover:bg-[#1A1A1A] active:bg-[#222222] transition-colors"
              >
                {num}
              </button>
            ))}
            <div /> {/* Empty space */}
            <button
              onClick={() => handleDigitPress('0')}
              className="h-16 rounded-2xl bg-[#161616] text-[#F1F1F1] text-2xl font-semibold hover:bg-[#1A1A1A] active:bg-[#222222] transition-colors"
            >
              0
            </button>
            <button
              onClick={handleBackspace}
              className="h-16 rounded-2xl bg-[#161616] text-[#636363] hover:bg-[#1A1A1A] active:bg-[#222222] transition-colors flex items-center justify-center"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
          20%, 40%, 60%, 80% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
