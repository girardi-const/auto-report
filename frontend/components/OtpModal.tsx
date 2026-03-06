'use client';

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { X, ShieldAlert, ShieldCheck, Loader2 } from 'lucide-react';

const TOKEN = process.env.NEXT_PUBLIC_TOKEN ?? '';
const CODE_LENGTH = 6;

interface OtpModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    /** Label shown above the OTP input */
    title: string;
    description?: string;
}

export default function OtpModal({ open, onClose, onConfirm, title, description }: OtpModalProps) {
    const [step, setStep] = useState<'otp' | 'confirm'>('otp');
    const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

    // Reset state when modal opens
    useEffect(() => {
        if (open) {
            setStep('otp');
            setDigits(Array(CODE_LENGTH).fill(''));
            setError('');
            setLoading(false);
            // Focus first input after a tick
            setTimeout(() => inputsRef.current[0]?.focus(), 50);
        }
    }, [open]);

    const handleChange = (index: number, value: string) => {
        // Allow letters and digits
        const char = value.replace(/[^a-zA-Z0-9]/g, '').slice(-1).toUpperCase();
        const next = [...digits];
        next[index] = char;
        setDigits(next);
        setError('');

        // Auto-advance to next input
        if (char && index < CODE_LENGTH - 1) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !digits[index] && index > 0) {
            inputsRef.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/[^a-zA-Z0-9]/g, '').slice(0, CODE_LENGTH).toUpperCase();
        if (!pasted) return;
        const next = [...digits];
        for (let i = 0; i < CODE_LENGTH; i++) {
            next[i] = pasted[i] || '';
        }
        setDigits(next);
        // Focus last filled or last input
        const focusIdx = Math.min(pasted.length, CODE_LENGTH - 1);
        inputsRef.current[focusIdx]?.focus();
    };

    const handleSubmit = () => {
        const code = digits.join('');
        if (code.length < CODE_LENGTH) {
            setError('Preencha todos os dígitos');
            return;
        }
        if (code !== TOKEN.toUpperCase()) {
            setError('Token inválido');
            setDigits(Array(CODE_LENGTH).fill(''));
            setTimeout(() => inputsRef.current[0]?.focus(), 50);
            return;
        }

        // Token valid → move to confirmation step
        setStep('confirm');
    };

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await onConfirm();
            onClose();
        } catch {
            setError('Erro ao executar a ação');
        } finally {
            setLoading(false);
        }
    };

    // Submit automatically when all digits are filled
    useEffect(() => {
        if (digits.every((d) => d !== '') && !loading) {
            handleSubmit();
        }
    }, [digits]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-sm mx-4 p-8 animate-in zoom-in-95 fade-in duration-200">
                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X size={18} />
                </button>

                {step === 'otp' ? (
                    /* ── Step 1: OTP Input ─────────────────────── */
                    <>
                        {/* Icon */}
                        <div className="flex justify-center mb-4">
                            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                                <ShieldAlert className="w-6 h-6 text-amber-600" />
                            </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-center text-lg font-bold text-secondary mb-1">{title}</h3>
                        {description && (
                            <p className="text-center text-gray-400 text-sm mb-6">{description}</p>
                        )}

                        {/* OTP Inputs */}
                        <div className="flex justify-center gap-2 mb-4">
                            {digits.map((digit, i) => (
                                <input
                                    key={i}
                                    ref={(el) => { inputsRef.current[i] = el; }}
                                    type="text"
                                    inputMode="text"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleChange(i, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(i, e)}
                                    onPaste={i === 0 ? handlePaste : undefined}
                                    disabled={loading}
                                    className={`w-11 h-14 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all duration-200
                                        ${error
                                            ? 'border-red-300 bg-red-50 text-red-600 animate-shake'
                                            : digit
                                                ? 'border-primary bg-primary/5 text-secondary'
                                                : 'border-gray-200 bg-gray-50 text-gray-800'
                                        }
                                        focus:border-primary focus:ring-2 focus:ring-primary/20
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                    `}
                                />
                            ))}
                        </div>

                        {/* Error */}
                        {error && (
                            <p className="text-center text-red-500 text-xs font-medium mb-4 animate-in fade-in slide-in-from-top-1 duration-200">
                                {error}
                            </p>
                        )}

                        <p className="text-center text-gray-300 text-xs mt-4 uppercase tracking-widest font-medium">
                            Digite o token de segurança
                        </p>
                    </>
                ) : (
                    /* ── Step 2: Confirmation ──────────────────── */
                    <>
                        {/* Icon */}
                        <div className="flex justify-center mb-4">
                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                                <ShieldCheck className="w-6 h-6 text-green-600" />
                            </div>
                        </div>

                        <h3 className="text-center text-lg font-bold text-secondary mb-1">Confirmar Ação</h3>
                        <p className="text-center text-gray-400 text-sm mb-6">
                            Token verificado. Deseja realmente <strong>{title.toLowerCase()}</strong>?
                        </p>

                        {/* Error */}
                        {error && (
                            <p className="text-center text-red-500 text-xs font-medium mb-4 animate-in fade-in slide-in-from-top-1 duration-200">
                                {error}
                            </p>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all duration-200 text-sm uppercase tracking-widest disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={loading}
                                className="flex-1 px-4 py-3 bg-primary hover:bg-[#c91e25] active:scale-[0.98] text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all duration-200 text-sm uppercase tracking-widest disabled:opacity-50"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                                ) : (
                                    'Confirmar'
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
