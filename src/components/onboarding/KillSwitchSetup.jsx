import { useState, useRef, useEffect } from 'react';
import { setKillCode } from '../../services/storage/settingsStorage';

export default function KillSwitchSetup({ onNext, onBack }) {
  const [code, setCode] = useState(['', '', '', '']);
  const [confirmCode, setConfirmCode] = useState(['', '', '', '']);
  const [step, setStep] = useState('enter'); // 'enter' | 'confirm' | 'success'
  const [error, setError] = useState('');

  const inputRefs = useRef([]);
  const confirmInputRefs = useRef([]);

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  useEffect(() => {
    // Focus first confirm input when moving to confirm step
    if (step === 'confirm' && confirmInputRefs.current[0]) {
      confirmInputRefs.current[0].focus();
    }
  }, [step]);

  const handleCodeChange = (index, value, isConfirm = false) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const refs = isConfirm ? confirmInputRefs : inputRefs;
    const setter = isConfirm ? setConfirmCode : setCode;

    setter(prev => {
      const newCode = [...prev];
      newCode[index] = digit;
      return newCode;
    });

    setError('');

    // Auto-advance to next input
    if (digit && index < 3) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e, isConfirm = false) => {
    const refs = isConfirm ? confirmInputRefs : inputRefs;
    const currentCode = isConfirm ? confirmCode : code;

    if (e.key === 'Backspace' && !currentCode[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e, isConfirm = false) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    const setter = isConfirm ? setConfirmCode : setCode;
    const refs = isConfirm ? confirmInputRefs : inputRefs;

    if (paste.length === 4) {
      setter(paste.split(''));
      refs.current[3]?.focus();
    }
  };

  const handleContinue = () => {
    const codeStr = code.join('');

    if (codeStr.length !== 4) {
      setError('Please enter a 4-digit code');
      return;
    }

    if (step === 'enter') {
      setStep('confirm');
    } else if (step === 'confirm') {
      const confirmStr = confirmCode.join('');

      if (codeStr !== confirmStr) {
        setError('Codes do not match. Please try again.');
        setConfirmCode(['', '', '', '']);
        confirmInputRefs.current[0]?.focus();
        return;
      }

      // Save the code
      setKillCode(codeStr);
      setStep('success');
    }
  };

  const handleReset = () => {
    setCode(['', '', '', '']);
    setConfirmCode(['', '', '', '']);
    setStep('enter');
    setError('');
    inputRefs.current[0]?.focus();
  };

  const renderCodeInputs = (values, refs, isConfirm = false) => (
    <div className="flex justify-center items-center gap-4 py-6">
      {values.map((digit, index) => (
        <input
          key={index}
          ref={el => refs.current[index] = el}
          type="tel"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={e => handleCodeChange(index, e.target.value, isConfirm)}
          onKeyDown={e => handleKeyDown(index, e, isConfirm)}
          onPaste={e => handlePaste(e, isConfirm)}
          className="w-16 h-16 bg-zinc-900 border-2 border-zinc-700 rounded-2xl text-3xl font-bold text-center text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
        />
      ))}
    </div>
  );

  if (step === 'success') {
    return (
      <div className="flex flex-col min-h-full px-6 py-8 bg-[#09090B]">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-900/50 flex items-center justify-center">
            <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Kill Switch Set!</h2>
          <p className="text-zinc-400 max-w-sm mx-auto">
            Your emergency code is ready. Enter it anytime to instantly stop the alarm.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            {code.map((digit, i) => (
              <span key={i} className="w-12 h-14 flex items-center justify-center text-2xl font-bold bg-zinc-900 border-2 border-sky-500 text-white rounded-2xl">
                {digit}
              </span>
            ))}
          </div>
          <p className="mt-4 text-sm text-zinc-500">Remember this code!</p>
        </div>

        <div className="space-y-3 pt-6">
          <button
            onClick={onNext}
            className="w-full py-4 px-6 bg-sky-500 text-white font-semibold rounded-xl hover:bg-sky-600 active:bg-sky-700 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full px-6 py-8 bg-[#09090B]">
      <div className="flex-1">
        <div className="mb-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-sky-900/50 flex items-center justify-center">
            <svg className="w-10 h-10 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            {step === 'enter' ? 'Create Kill Switch' : 'Confirm Your Code'}
          </h2>
          <p className="text-zinc-400 max-w-sm mx-auto">
            {step === 'enter'
              ? 'Set a 4-digit emergency code to instantly stop the alarm when needed.'
              : 'Enter your code again to confirm.'}
          </p>
        </div>

        <div className="mb-6">
          {step === 'enter'
            ? renderCodeInputs(code, inputRefs, false)
            : renderCodeInputs(confirmCode, confirmInputRefs, true)}
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-xl p-3 mb-6">
            <p className="text-red-300 text-sm text-center">{error}</p>
          </div>
        )}

        {step === 'enter' && (
          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
            <h4 className="font-medium text-white mb-2">When to use the kill switch:</h4>
            <ul className="space-y-1 text-sm text-zinc-400">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full" />
                Emergency situations
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full" />
                When you've already woken up another way
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full" />
                Technical issues with questions
              </li>
            </ul>
          </div>
        )}

        {step === 'confirm' && (
          <button
            onClick={handleReset}
            className="w-full py-2 text-sky-400 font-medium text-sm hover:text-sky-300 transition-colors"
          >
            Start over with a different code
          </button>
        )}
      </div>

      <div className="space-y-3 pt-6">
        <button
          onClick={handleContinue}
          disabled={step === 'enter' ? code.some(d => !d) : confirmCode.some(d => !d)}
          className="w-full py-4 px-6 bg-sky-500 text-white font-semibold rounded-xl hover:bg-sky-600 active:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {step === 'enter' ? 'Continue' : 'Confirm Code'}
        </button>
        <button
          onClick={onBack}
          className="w-full py-3 px-6 text-zinc-400 font-medium hover:text-white transition-colors"
        >
          Back
        </button>
      </div>
    </div>
  );
}
