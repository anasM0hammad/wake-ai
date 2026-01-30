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
      <div className={`relative w-full max-w-sm mx-4 bg-gray-900 rounded-2xl overflow-hidden ${isShaking ? 'animate-shake' : ''}`}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Kill Switch</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <p className="text-gray-400 text-center mb-6">
            Enter your 4-digit code
          </p>

          {/* Code display */}
          <div className={`flex justify-center gap-3 mb-6 ${isShaking ? 'animate-shake' : ''}`}>
            {code.map((digit, index) => (
              <div
                key={index}
                className={`w-14 h-16 rounded-xl border-2 flex items-center justify-center text-2xl font-bold ${
                  error
                    ? 'border-red-500 bg-red-500/10 text-red-400'
                    : digit
                    ? 'border-indigo-500 bg-indigo-500/10 text-white'
                    : 'border-gray-700 bg-gray-800 text-gray-400'
                }`}
              >
                {digit ? '•' : ''}
              </div>
            ))}
          </div>

          {/* Error message */}
          {error && (
            <p className="text-red-400 text-center text-sm mb-4">
              Wrong code. {remainingAttempts} {remainingAttempts === 1 ? 'attempt' : 'attempts'} remaining.
            </p>
          )}

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleDigitPress(num.toString())}
                className="h-16 rounded-xl bg-gray-800 text-white text-2xl font-semibold hover:bg-gray-700 active:bg-gray-600 transition-colors"
              >
                {num}
              </button>
            ))}
            <div /> {/* Empty space */}
            <button
              onClick={() => handleDigitPress('0')}
              className="h-16 rounded-xl bg-gray-800 text-white text-2xl font-semibold hover:bg-gray-700 active:bg-gray-600 transition-colors"
            >
              0
            </button>
            <button
              onClick={handleBackspace}
              className="h-16 rounded-xl bg-gray-800 text-gray-400 hover:bg-gray-700 active:bg-gray-600 transition-colors flex items-center justify-center"
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
