import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../services/api.js";
import {
  Lock,
  User,
  RefreshCw,
  AlertCircle,
  Ban,
  ArrowLeft,
  Mail,
  ShieldAlert,
} from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [captchaData, setCaptchaData] = useState({
    image_url: "",
    hashkey: "",
  });
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    captcha: "",
  });
  const [pin, setPin] = useState("");
  const [step, setStep] = useState(1); // Step 1: Login, Step 2: PIN, Step 3: Forgot Password Panel
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [accessRevoked, setAccessRevoked] = useState(false);

  // Recovery Form State Parameters
  const [recoveryData, setRecoveryData] = useState({
    username: "",
    email: "",
    newPin: "",
  });

  const fetchCaptcha = async () => {
    setError("");
    try {
      const res = await authAPI.getCaptcha();
      setCaptchaData(res.data);
    } catch (err) {
      setError("Security server offline.");
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const getCaptchaUrl = () => {
    if (!captchaData.image_url) return "";
    return captchaData.image_url.startsWith("http")
      ? captchaData.image_url
      : `http://13.48.84.7${captchaData.image_url}`;
  };

  // Hardware Canvas Fingerprinting Generator
  const generateCanvasHash = () => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 200;
      canvas.height = 40;

      const ctx = canvas.getContext("2d");
      ctx.textBaseline = "top";
      ctx.font = "14px 'Arial'";
      ctx.fillStyle = "#f60";
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = "#069";
      ctx.fillText("Paragrine_Identity_Gate_2026", 2, 15);
      ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
      ctx.fillText("Paragrine_Identity_Gate_2026", 4, 17);
      return canvas.toDataURL().slice(-60);
    } catch (e) {
      return "unsupported";
    }
  };

  // Compile full workstation environmental properties
  const captureDeviceMetadata = () => {
    const ua = navigator.userAgent;
    let browser = "Other-Browser";

    if (ua.includes("Edg")) browser = "Edge";
    else if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Safari") && !ua.includes("Chrome"))
      browser = "Safari";

    let os = "Other-OS";
    if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Macintosh")) os = "MacOS";
    else if (ua.includes("Linux")) os = "Linux";

    const canvasHash = generateCanvasHash();
    const resolution = `${window.screen.width}x${window.screen.height}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const generatedVisitorId = btoa(
      `${os}-${browser}-${resolution}-${timezone}-${canvasHash.slice(0, 10)}`,
    ).slice(0, 32);

    return {
      visitor_id: generatedVisitorId,
      os: os,
      browser: browser,
      screen_resolution: resolution,
      timezone: timezone,
      canvas_hash: canvasHash,
    };
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    const currentDeviceMetadata = captureDeviceMetadata();

    try {
      const res = await authAPI.loginStepOne({
        username: formData.username,
        password: formData.password,
        captcha_key: captchaData.hashkey,
        captcha_value: formData.captcha,
        device_metadata: currentDeviceMetadata,
      });
      if (res.data.require_pin) {
        setUserId(res.data.user_id);
        setStep(2);
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setAccessRevoked(true);
        setError(
          err.response.data.detail || "Access Revoked by Administrator.",
        );
      } else {
        setError(err.response?.data?.error || "Authentication failed.");
        fetchCaptcha();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.verifyPin(userId, pin);

      sessionStorage.setItem("access_token", res.data.access);
      sessionStorage.setItem("user_id", res.data.user_id || userId);

      // FIX: Dynamically set role based on backend 'is_staff' flag
      sessionStorage.setItem(
        "user_role",
        res.data.user.is_staff ? "admin" : "user",
      );

      // Routes directly to your new system dashboard page
      navigate("/dashboard");
    } catch (err) {
      if (err.response?.status === 403) {
        setAccessRevoked(true);
        setError("Your access was revoked during the verification process.");
      } else {
        setError("Invalid security PIN.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Trigger Identity Password/PIN Recovery API Call
  const handleRecoverySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      await authAPI.forgotPassword({
        username: recoveryData.username,
        email: recoveryData.email,
        new_pin: recoveryData.newPin,
      });

      setSuccessMessage(
        "Identity verified. Secondary PIN updated successfully!",
      );
      setRecoveryData({ username: "", email: "", newPin: "" });
      setTimeout(() => {
        setStep(1);
        setSuccessMessage("");
        fetchCaptcha();
      }, 2500);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          "Recovery process failed.",
      );
    } finally {
      setLoading(false);
    }
  };

  const resetLogin = () => {
    setAccessRevoked(false);
    setStep(1);
    setError("");
    setSuccessMessage("");
    setFormData({ ...formData, captcha: "" });
    fetchCaptcha();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-6 font-sans">
      <div className="bg-white px-5 sm:px-8 py-6 sm:py-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-[22rem] sm:max-w-sm border border-slate-100 flex flex-col animate-in fade-in zoom-in duration-300">
        {/* Branding Header */}
        <div className="text-center mb-4 sm:mb-6 flex flex-col items-center">
          {accessRevoked ? (
            <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-2xl mb-2 sm:mb-3 shadow-inner bg-red-50 text-red-500">
              <Ban size={24} />
            </div>
          ) : (
            <div className="flex flex-col items-center mb-1">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-[0.25em] uppercase select-none mt-2">
                AGC Automation
              </h2>
              <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-1">
                Centralized Portal
              </p>
            </div>
          )}
        </div>

        {/* Dynamic Content Card */}
        {accessRevoked ? (
          <div className="text-center space-y-4 animate-in slide-in-from-bottom-4 duration-500">
            <div className="p-3 bg-red-50 rounded-2xl border border-red-100">
              <h3 className="text-[13px] sm:text-sm font-black text-red-800 uppercase tracking-tight mb-1">
                Access Denied
              </h3>
              <p className="text-[10px] sm:text-[11px] text-red-600 font-medium leading-relaxed">
                {error}
              </p>
            </div>
            <button
              onClick={resetLogin}
              className="flex items-center justify-center gap-2 w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors py-2"
            >
              <ArrowLeft size={14} /> Back to Identity Entry
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center gap-3 text-[11px] sm:text-xs font-bold rounded-r-xl">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 flex items-center gap-3 text-[11px] sm:text-xs font-bold rounded-r-xl">
                <AlertCircle size={16} className="text-emerald-500 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {step === 1 && (
              <form
                onSubmit={handleLoginSubmit}
                className="space-y-3 sm:space-y-4"
              >
                <div className="relative">
                  <User
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="Username"
                    required
                    className="w-full pl-11 pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-slate-400 outline-none transition-all"
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                  />
                </div>
                <div className="relative">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    required
                    className="w-full pl-11 pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-slate-400 outline-none transition-all"
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-[1.5rem] border border-slate-200 mt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      Identity Verification
                    </span>
                    <button
                      type="button"
                      onClick={fetchCaptcha}
                      className="text-slate-500 hover:rotate-180 transition-transform duration-500 p-1"
                    >
                      <RefreshCw size={12} />
                    </button>
                  </div>
                  <div className="flex justify-center bg-white p-2 rounded-xl border border-slate-100 mb-2 h-12 shadow-sm w-full overflow-hidden">
                    {captchaData.image_url ? (
                      <img
                        src={getCaptchaUrl()}
                        alt="captcha"
                        className="h-full object-contain max-w-full mix-blend-multiply opacity-80"
                      />
                    ) : (
                      <div className="h-full flex items-center text-[10px] text-slate-300 italic">
                        Initializing security...
                      </div>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="CAPTCHA CODE"
                    required
                    autoComplete="off"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-center text-[11px] sm:text-xs font-black tracking-[0.2em] sm:tracking-[0.3em] uppercase focus:ring-2 focus:ring-slate-400 outline-none bg-white"
                    onChange={(e) =>
                      setFormData({ ...formData, captcha: e.target.value })
                    }
                  />
                </div>

                <div className="text-right px-1 pb-1">
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setStep(3);
                    }}
                    className="text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors py-1"
                  >
                    Forgot Security PIN Clearance?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#64748b] hover:bg-[#475569] text-white py-3 sm:py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-slate-200 active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? "Authenticating..." : "Login"}
                </button>
              </form>
            )}

            {step === 2 && (
              <form
                onSubmit={handleVerifyPin}
                className="space-y-4 sm:space-y-6 text-center animate-in slide-in-from-right-4 duration-300"
              >
                <div>
                  <p className="text-sm font-black text-slate-800 uppercase tracking-tight">
                    Secondary Clearance
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 font-medium">
                    Enter your unique 6-digit access PIN
                  </p>
                </div>
                <input
                  type="password"
                  maxLength="6"
                  placeholder="••••••"
                  autoFocus
                  required
                  className="w-full text-center text-2xl sm:text-3xl tracking-[0.3em] sm:tracking-[0.5em] py-3 border-b-4 border-slate-400 outline-none bg-transparent font-mono text-slate-800 placeholder:text-slate-200 focus:border-[#64748b] transition-colors"
                  onChange={(e) => setPin(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={loading || pin.length < 4}
                  className="w-full bg-[#64748b] hover:bg-[#475569] text-white py-3 sm:py-3.5 rounded-2xl font-black text-[13px] sm:text-sm uppercase tracking-widest transition-all shadow-xl shadow-slate-200 disabled:opacity-50 active:scale-[0.98]"
                >
                  {loading ? "Verifying..." : "Authorize Access"}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-[9px] sm:text-[10px] text-slate-500 font-black uppercase tracking-widest transition-colors hover:text-slate-800 pt-2 pb-1 block w-full"
                >
                  Cancel Authorization
                </button>
              </form>
            )}

            {step === 3 && (
              <form
                onSubmit={handleRecoverySubmit}
                className="space-y-3 sm:space-y-4 animate-in slide-in-from-left-4 duration-300"
              >
                <div className="text-center mb-2 sm:mb-3">
                  <p className="text-sm font-black text-slate-800 uppercase tracking-tight">
                    Identity Recovery
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 font-medium px-2">
                    Verify account data vectors to cycle clearance fields
                  </p>
                </div>

                <div className="relative">
                  <User
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="Account Username"
                    required
                    value={recoveryData.username}
                    className="w-full pl-11 pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-slate-400 outline-none transition-all"
                    onChange={(e) =>
                      setRecoveryData({
                        ...recoveryData,
                        username: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="relative">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                  <input
                    type="email"
                    placeholder="Registered Profile Email"
                    required
                    value={recoveryData.email}
                    className="w-full pl-11 pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-slate-400 outline-none transition-all"
                    onChange={(e) =>
                      setRecoveryData({
                        ...recoveryData,
                        email: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="relative">
                  <ShieldAlert
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                  <input
                    type="password"
                    maxLength="6"
                    placeholder="Configure New 6-Digit PIN"
                    required
                    value={recoveryData.newPin}
                    className="w-full pl-11 pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-slate-400 outline-none transition-all font-mono placeholder:font-sans"
                    onChange={(e) =>
                      setRecoveryData({
                        ...recoveryData,
                        newPin: e.target.value,
                      })
                    }
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || recoveryData.newPin.length !== 6}
                  className="w-full bg-slate-900 text-white py-3 sm:py-3.5 rounded-2xl font-black text-[13px] sm:text-sm uppercase tracking-widest hover:bg-[#64748b] transition-all shadow-xl active:scale-[0.98] disabled:opacity-50 mt-2"
                >
                  {loading ? "Processing Reset..." : "Reset Clearance PIN"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setStep(1);
                  }}
                  className="w-full flex items-center justify-center gap-2 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors pt-3 pb-1"
                >
                  <ArrowLeft size={14} /> Back to Identity Entry
                </button>
              </form>
            )}
          </>
        )}

        <div className="mt-5 sm:mt-6 text-center border-t border-slate-50 pt-4">
          <p className="text-[9px] text-slate-300 font-bold uppercase tracking-[0.15em]">
            &copy; 2026{" "}
            <a
              href="https://pragicts.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-500 transition-colors"
            >
              PragICTS Automation System
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
