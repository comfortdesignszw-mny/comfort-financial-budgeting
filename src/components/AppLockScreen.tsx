import React, { useState, useEffect } from "react";
import {
  Shield,
  Delete,
  KeyRound,
  Mail,
  Smartphone,
  ArrowRight,
  X,
  ShieldAlert
} from "lucide-react";

export default function AppLockScreen({
  onUnlock,
  onResetPin,
}: {
  onUnlock: (pin: string) => Promise<boolean>;
  onResetPin: (pin: string) => Promise<void>;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  // Lockout States
  const [failedAttempts, setFailedAttempts] = useState(() => {
    const stored = localStorage.getItem('app_lock_attempts');
    return stored ? parseInt(stored, 10) : 0;
  });
  const [lockoutRound, setLockoutRound] = useState(() => {
    const stored = localStorage.getItem('app_lock_round');
    return stored ? parseInt(stored, 10) : 0;
  });
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(() => {
    const stored = localStorage.getItem('app_lock_until');
    return stored ? parseInt(stored, 10) : null;
  });
  const [remainingTime, setRemainingTime] = useState<number>(0);

  useEffect(() => {
    if (!lockoutUntil) return;

    const interval = setInterval(() => {
      const now = Date.now();
      if (now >= lockoutUntil) {
        setLockoutUntil(null);
        setRemainingTime(0);
        setFailedAttempts(0);
        localStorage.removeItem('app_lock_until');
        localStorage.setItem('app_lock_attempts', '0');
        clearInterval(interval);
      } else {
        setRemainingTime(Math.ceil((lockoutUntil - now) / 1000));
      }
    }, 1000);

    const now = Date.now();
    if (now >= lockoutUntil) {
        setLockoutUntil(null);
        setRemainingTime(0);
        setFailedAttempts(0);
        localStorage.removeItem('app_lock_until');
        localStorage.setItem('app_lock_attempts', '0');
    } else {
        setRemainingTime(Math.ceil((lockoutUntil - now) / 1000));
    }

    return () => clearInterval(interval);
  }, [lockoutUntil]);

  // Recovery States
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<
    "method" | "otp" | "new_pin" | "confirm_pin"
  >("method");
  const [recoveryMethod, setRecoveryMethod] = useState<
    "phone" | "email" | null
  >(null);
  const [otpInput, setOtpInput] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [recoveryError, setRecoveryError] = useState("");

  const handleKeyPress = async (key: string) => {
    if (lockoutUntil) return;

    if (error) {
      setError(false);
      setPin("");
    }

    if (key === "delete") {
      setPin((prev) => prev.slice(0, -1));
      return;
    }

    if (pin.length < 4) {
      const newPinValue = pin + key;
      setPin(newPinValue);

      if (newPinValue.length === 4) {
        const success = await onUnlock(newPinValue);
        if (!success) {
          const newFailedAttempts = failedAttempts + 1;
          setFailedAttempts(newFailedAttempts);
          localStorage.setItem('app_lock_attempts', newFailedAttempts.toString());
          
          if (newFailedAttempts >= 5) {
             const newRound = lockoutRound + 1;
             setLockoutRound(newRound);
             localStorage.setItem('app_lock_round', newRound.toString());
             
             const duration = newRound === 1 ? 60000 : 300000;
             const until = Date.now() + duration;
             setLockoutUntil(until);
             localStorage.setItem('app_lock_until', until.toString());
             
             setPin("");
             setError(true);
          } else {
            setError(true);
            setTimeout(() => {
              setPin("");
              setError(false);
            }, 800);
          }
        } else {
          setFailedAttempts(0);
          setLockoutRound(0);
          localStorage.removeItem('app_lock_attempts');
          localStorage.removeItem('app_lock_round');
          localStorage.removeItem('app_lock_until');
        }
      }
    }
  };

  const handleStartRecovery = () => {
    setShowRecovery(true);
    setRecoveryStep("method");
    setRecoveryMethod(null);
    setRecoveryError("");
    setOtpInput("");
    setNewPin("");
    setConfirmPin("");
  };

  const handleMethodSelect = (method: "phone" | "email") => {
    setRecoveryMethod(method);
    if (method === "phone") {
      // Simulate sending OTP
      setRecoveryStep("otp");
    } else {
      // Simulate sending email and assuming they clicked the link
      setRecoveryStep("new_pin");
    }
  };

  const handleVerifyOtp = () => {
    if (otpInput === "1234") {
      // Dummy OTP for simulation
      setRecoveryStep("new_pin");
      setRecoveryError("");
    } else {
      setRecoveryError("Invalid OTP. Please use 1234 for simulation.");
    }
  };

  const handleSaveNewPin = async () => {
    if (newPin.length !== 4) {
      setRecoveryError("PIN must be 4 digits.");
      return;
    }
    setRecoveryStep("confirm_pin");
    setRecoveryError("");
  };

  const handleConfirmNewPin = async () => {
    if (confirmPin !== newPin) {
      setRecoveryError("PINs do not match.");
      setConfirmPin("");
      setRecoveryStep("new_pin");
      return;
    }
    // Success
    await onResetPin(newPin);
  };

  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 z-[99999]">
      {!showRecovery ? (
        <div className="flex flex-col items-center max-w-sm w-full animate-in fade-in duration-300">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-blue-200 dark:border-blue-800">
            <Shield size={32} className="text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            App Locked
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 font-medium">
            Enter your 4-digit PIN to access your data.
          </p>

          <div className={`flex gap-6 mb-10 ${error ? "animate-shake" : ""}`}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${pin.length > i ? "bg-blue-600 dark:bg-blue-500 scale-125 shadow-md shadow-blue-500/20" : "bg-slate-200 dark:bg-slate-800"}`}
              />
            ))}
          </div>

          <div className="h-6 relative mb-4 flex flex-col items-center justify-center w-full">
            {error && !lockoutUntil && (
              <p className="text-xs font-bold text-red-500 absolute w-full text-center">
                Incorrect PIN. Try again.
              </p>
            )}
          </div>

          {lockoutUntil ? (
            <div className="flex flex-col items-center justify-center p-6 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20 mb-8 w-full max-w-[280px]">
              <span className="text-red-500 mb-2">
                <ShieldAlert size={32} />
              </span>
              <h3 className="font-bold text-red-600 dark:text-red-400 mb-1">Too many attempts</h3>
              <p className="text-sm text-red-500 font-medium text-center">
                Try again in {Math.floor(remainingTime / 60)}:{(remainingTime % 60).toString().padStart(2, '0')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-5 w-full max-w-[280px] mb-8">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handleKeyPress(num.toString())}
                  className="h-16 rounded-full text-2xl font-semibold bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition active:scale-95 shadow-sm"
                >
                  {num}
                </button>
              ))}
              <div className="h-16"></div>
              <button
                onClick={() => handleKeyPress("0")}
                className="h-16 rounded-full text-2xl font-semibold bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition active:scale-95 shadow-sm"
              >
                0
              </button>
              <button
                onClick={() => handleKeyPress("delete")}
                className="h-16 rounded-full text-sm font-semibold bg-slate-100 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center transition active:scale-95 shadow-sm"
              >
                <Delete size={24} />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleStartRecovery}
            className="text-xs font-semibold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition"
          >
            Forgot PIN?
          </button>
        </div>
      ) : (
        <div className="flex flex-col max-w-sm w-full bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 animate-in zoom-in duration-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <KeyRound size={20} className="text-blue-600" /> Reset App PIN
            </h3>
            <button
              onClick={() => setShowRecovery(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={20} />
            </button>
          </div>

          {recoveryError && (
            <div className="mb-4 text-xs font-bold text-red-600 bg-red-50 p-3 rounded-lg dark:bg-red-900/20 dark:text-red-400">
              {recoveryError}
            </div>
          )}

          {recoveryStep === "method" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-4">
                Choose a method to recover your PIN. Instructions will be sent
                to your registered contact.
              </p>

              <button
                onClick={() => handleMethodSelect("phone")}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-slate-800/80 border border-slate-100 dark:border-slate-700 rounded-xl transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 rounded-lg">
                    <Smartphone size={18} />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      Phone Number
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Receive an OTP via SMS
                    </div>
                  </div>
                </div>
                <ArrowRight size={16} className="text-slate-400" />
              </button>

              <button
                onClick={() => handleMethodSelect("email")}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-slate-800/80 border border-slate-100 dark:border-slate-700 rounded-xl transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400 rounded-lg">
                    <Mail size={18} />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      Email Address
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Receive a reset link
                    </div>
                  </div>
                </div>
                <ArrowRight size={16} className="text-slate-400" />
              </button>
            </div>
          )}

          {recoveryStep === "otp" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-4">
                An OTP has been sent to your phone. Enter it below to proceed.{" "}
                <br />
                <span className="text-blue-500">(Use 1234 for simulation)</span>
              </p>

              <input
                type="text"
                maxLength={4}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter 4-digit OTP"
                className="w-full p-4 text-center tracking-[0.5em] font-bold text-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              />

              <button
                onClick={handleVerifyOtp}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition"
              >
                Verify OTP
              </button>
            </div>
          )}

          {recoveryStep === "new_pin" && (
            <div className="space-y-4">
              {recoveryMethod === "email" && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mb-2 p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                  Reset link authenticated successfully.
                </p>
              )}
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-4">
                Create your new 4-digit security PIN.
              </p>

              <input
                type="password"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                autoFocus
                className="w-full p-4 text-center tracking-[1em] font-bold text-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white max-w-[200px] mx-auto block"
              />

              <button
                onClick={handleSaveNewPin}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition mt-4"
              >
                Continue
              </button>
            </div>
          )}

          {recoveryStep === "confirm_pin" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-4">
                Re-enter your new PIN to confirm.
              </p>

              <input
                type="password"
                maxLength={4}
                value={confirmPin}
                onChange={(e) =>
                  setConfirmPin(e.target.value.replace(/\D/g, ""))
                }
                placeholder="••••"
                autoFocus
                className="w-full p-4 text-center tracking-[1em] font-bold text-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white max-w-[200px] mx-auto block"
              />

              <button
                onClick={handleConfirmNewPin}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition mt-4"
              >
                Save New PIN
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
