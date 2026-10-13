import React, { useState } from "react";
import {
  FileSpreadsheet,
  Lock,
  Mail,
  User,
  ShieldCheck,
  Eye,
  EyeOff,
  Building2,
  BadgeCheck,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Check,
  AlertCircle,
  GraduationCap,
  KeyRound,
  Send,
  Info,
} from "lucide-react";
import { AuthUser, UserRole } from "../types";
import { loginUser, registerUser, getDemoAccounts } from "../utils/authService";
import {
  dispatchLoginNotificationEmail,
  dispatchRegistrationEmail,
  getEmailConfig,
} from "../utils/emailNotificationService";

interface AuthPageProps {
  onLoginSuccess: (user: AuthUser) => void;
}

const DEPARTMENTS = [
  "Computer Science & Engineering",
  "Information Technology",
  "Electronics & Communication Engineering",
  "Electrical & Electronics Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Artificial Intelligence & Data Science",
  "School of Management & Business Analytics",
  "Controller of Examinations (CoE)",
];

const ROLES: { role: UserRole; desc: string }[] = [
  {
    role: "Dean / Administrator",
    desc: "Full institutional oversight, configuration, and analytical reports",
  },
  {
    role: "Faculty / Professor",
    desc: "Marks entry, student assessment updates, and performance prediction",
  },
  {
    role: "Examination Controller",
    desc: "Arrear registers, pass/fail validation, and master Excel generation",
  },
  {
    role: "Department Coordinator",
    desc: "Batch records verification, ranking audits, and class summaries",
  },
];

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<"login" | "register">("login");

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regRole, setRegRole] = useState<UserRole>("Faculty / Professor");
  const [regDepartment, setRegDepartment] = useState(DEPARTMENTS[0]);
  const [regStaffId, setRegStaffId] = useState(`FAC-${new Date().getFullYear()}-101`);
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(true);

  // Feedback & UI status
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const demoAccounts = getDemoAccounts();

  // Password strength calculation for registration
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, text: "None", color: "bg-slate-200" };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score: 1, text: "Weak", color: "bg-rose-500" };
    if (score <= 4) return { score: 2, text: "Good", color: "bg-amber-500" };
    return { score: 3, text: "Strong", color: "bg-emerald-500" };
  };

  const passStrength = getPasswordStrength(regPassword);

  const handleQuickDemoFill = (acc: typeof demoAccounts[0]) => {
    setMode("login");
    setLoginEmail(acc.email);
    setLoginPassword(acc.password);
    setErrorMsg(null);
    setSuccessMsg(`Loaded credentials for ${acc.name} (${acc.role}). Click 'Sign In' to enter.`);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    setTimeout(() => {
      const result = loginUser({
        email: loginEmail,
        password: loginPassword,
        rememberMe,
      });

      setIsSubmitting(false);

      if (!result.success || !result.user) {
        setErrorMsg(result.error || "Login failed. Please check your credentials.");
      } else {
        // Dispatch automated security alert email to faculty's mail address
        const mailConfig = getEmailConfig();
        if (mailConfig.enableLoginAlerts) {
          dispatchLoginNotificationEmail(result.user, "Faculty Web Portal (Verified Session)");
        }
        setSuccessMsg(
          `Welcome, ${result.user.name}! Official login details automatically sent from ${mailConfig.senderEmail} to ${result.user.email}. Loading home page...`
        );
        setTimeout(() => {
          onLoginSuccess(result.user!);
        }, 950);
      }
    }, 250);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!termsAccepted) {
      setErrorMsg("Please acknowledge the academic authorization statement to continue.");
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const result = registerUser({
        name: regName,
        email: regEmail,
        password: regPassword,
        confirmPassword: regConfirmPassword,
        role: regRole,
        department: regDepartment,
        staffId: regStaffId,
      });

      setIsSubmitting(false);

      if (!result.success || !result.user) {
        setErrorMsg(result.error || "Registration failed. Please check your details.");
      } else {
        // Dispatch registration welcome email to faculty's email address
        const mailConfig = getEmailConfig();
        if (mailConfig.enableRegistrationWelcome) {
          dispatchRegistrationEmail(result.user);
        }
        setSuccessMsg(
          `Account created for ${result.user.name}! Welcome credentials email automatically sent from ${mailConfig.senderEmail} to ${result.user.email}. Entering portal...`
        );
        setTimeout(() => {
          onLoginSuccess(result.user!);
        }, 1050);
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Institutional Crest / Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-violet-500 text-white shadow-xl shadow-indigo-500/30 ring-1 ring-white/20 mb-4">
          <FileSpreadsheet className="w-8 h-8" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Student<span className="text-indigo-400">Excel</span> Portal
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          Institutional Academic Intelligence, Multi-Term Excel Processing & Arrear Records
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden">
          {/* Header Switcher Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50/80 p-1.5">
            <button
              type="button"
              id="tab-btn-signin"
              onClick={() => {
                setMode("login");
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all text-center cursor-pointer ${
                mode === "login"
                  ? "bg-white text-indigo-700 shadow-sm border border-slate-200/60 font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              Sign In to Account
            </button>
            <button
              type="button"
              id="tab-btn-register"
              onClick={() => {
                setMode("register");
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all text-center cursor-pointer ${
                mode === "register"
                  ? "bg-white text-indigo-700 shadow-sm border border-slate-200/60 font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              Create New Account (Register)
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {/* Quick Feedback Alert */}
            {errorMsg && (
              <div
                id="auth-error-alert"
                className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2.5 text-sm animate-fadeIn"
              >
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
                <div className="flex-1 font-medium">{errorMsg}</div>
              </div>
            )}

            {successMsg && (
              <div
                id="auth-success-alert"
                className="mb-6 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-2.5 text-sm animate-fadeIn"
              >
                <BadgeCheck className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
                <div className="flex-1 font-medium">{successMsg}</div>
              </div>
            )}

            {/* Faculty Email Notice Banner */}
            <div className="mb-5 p-3 rounded-xl bg-slate-50 border border-slate-200/90 text-xs flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-indigo-100 text-indigo-700">
                  <Mail className="w-3.5 h-3.5" />
                </span>
                <div>
                  <span className="font-semibold text-slate-700">Login alerts sent from: </span>
                  <code className="font-mono text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded text-[11px]">
                    portal-notifications@campus.edu
                  </code>
                </div>
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold hidden sm:inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                SSL Verified
              </span>
            </div>

            {/* LOGIN FORM */}
            {mode === "login" && (
              <div>
                {/* Quick 1-Click Demo Logins */}
                <div className="mb-6 bg-indigo-50/60 rounded-xl p-3.5 border border-indigo-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      Quick 1-Click Demo Fill:
                    </span>
                    <span className="text-[11px] text-indigo-600">Select any role to auto-fill</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {demoAccounts.map((acc) => (
                      <button
                        key={acc.email}
                        type="button"
                        onClick={() => handleQuickDemoFill(acc)}
                        className="py-1.5 px-2 bg-white hover:bg-indigo-600 hover:text-white text-slate-700 text-xs font-semibold rounded-lg border border-indigo-200 shadow-2xs transition-colors flex flex-col items-center cursor-pointer"
                        title={`Fill ${acc.email}`}
                      >
                        <span className="truncate w-full text-center font-bold">{acc.label}</span>
                        <span className="text-[10px] opacity-75 truncate">{acc.role.split("/")[0].trim()}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Email Address or Staff ID
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        id="login-email-input"
                        type="text"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="e.g. admin@campus.edu or FAC-2025-104"
                        className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowForgotModal(true)}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="login-password-input"
                        type={showLoginPassword ? "text" : "password"}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter your account password"
                        className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                        title={showLoginPassword ? "Hide password" : "Show password"}
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      <span>Keep me signed in</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    id="login-submit-btn"
                    disabled={isSubmitting}
                    className="w-full mt-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-xl shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <span>Verifying credentials...</span>
                    ) : (
                      <>
                        <span>Sign In & Open Dashboard</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500">
                  New institution faculty or staff member?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("register");
                      setErrorMsg(null);
                    }}
                    className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                  >
                    Register an institutional account
                  </button>
                </div>
              </div>
            )}

            {/* REGISTER FORM */}
            {mode === "register" && (
              <div>
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Full Name & Title
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        id="reg-name-input"
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="e.g. Dr. Rajesh Kumar or Prof. Ananya Iyer"
                        className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          id="reg-email-input"
                          type="email"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="e.g. user@campus.edu"
                          className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Staff / Employee ID
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <BadgeCheck className="w-4 h-4" />
                        </div>
                        <input
                          id="reg-staffid-input"
                          type="text"
                          required
                          value={regStaffId}
                          onChange={(e) => setRegStaffId(e.target.value)}
                          placeholder="e.g. FAC-2026-101"
                          className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Institutional Role Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Institutional Role
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {ROLES.map((r) => (
                        <div
                          key={r.role}
                          onClick={() => setRegRole(r.role)}
                          className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                            regRole === r.role
                              ? "bg-indigo-50/80 border-indigo-500 ring-1 ring-indigo-500 text-indigo-950 font-semibold"
                              : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span>{r.role}</span>
                            {regRole === r.role && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{r.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Department / Faculty Branch
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <select
                        id="reg-dept-select"
                        value={regDepartment}
                        onChange={(e) => setRegDepartment(e.target.value)}
                        className="w-full pl-10 pr-8 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all text-slate-900 cursor-pointer"
                      >
                        {DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Password & Confirm */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Password
                        </label>
                        <span className="text-[10px] font-semibold text-slate-500">
                          {passStrength.text}
                        </span>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          id="reg-password-input"
                          type={showRegPassword ? "text" : "password"}
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Min. 6 characters"
                          className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {/* Strength bar */}
                      <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${passStrength.color}`}
                          style={{ width: `${(passStrength.score / 3) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          id="reg-confirm-password-input"
                          type={showRegPassword ? "text" : "password"}
                          required
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="Re-enter password"
                          className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
                        />
                      </div>
                      {regConfirmPassword && regPassword !== regConfirmPassword && (
                        <p className="text-[11px] text-rose-600 mt-1">Passwords do not match</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-1">
                    <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 select-none">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      <span>
                        I certify that I am an authorized institutional personnel authorized to evaluate, update, and manage academic records.
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    id="reg-submit-btn"
                    disabled={isSubmitting}
                    className="w-full mt-3 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-xl shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <span>Setting up institutional profile...</span>
                    ) : (
                      <>
                        <span>Create Account & Enter Portal</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500">
                  Already have an existing account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setErrorMsg(null);
                    }}
                    className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                  >
                    Sign In here
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Institutional Features Highlights */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-white/5 border border-white/10 rounded-xl backdrop-blur-xs">
            <h4 className="text-xs font-bold text-indigo-300 mb-1">Excel Multi-Sheet Sync</h4>
            <p className="text-[11px] text-slate-400">Automated rank, grade, and arrear computation</p>
          </div>
          <div className="p-3 bg-white/5 border border-white/10 rounded-xl backdrop-blur-xs">
            <h4 className="text-xs font-bold text-indigo-300 mb-1">Arrear Register</h4>
            <p className="text-[11px] text-slate-400">Subject-wise & student-wise deficit analysis</p>
          </div>
          <div className="p-3 bg-white/5 border border-white/10 rounded-xl backdrop-blur-xs">
            <h4 className="text-xs font-bold text-indigo-300 mb-1">AI Pedagogical Guidance</h4>
            <p className="text-[11px] text-slate-400">Next-term grade projections and remedial insights</p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white text-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base">Account Credentials Helper</h3>
                <p className="text-xs text-slate-500">Institutional recovery & demo access</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              For testing in this environment, you can use any of the pre-configured verified institutional faculty accounts:
            </p>

            <div className="space-y-2 mb-5">
              {demoAccounts.map((d) => (
                <div
                  key={d.email}
                  className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-800">{d.label}: </span>
                    <span className="font-mono text-slate-600">{d.email}</span>
                  </div>
                  <div className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                    {d.password}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-500 mb-4">
              Tip: You can also click the quick-fill buttons on the login screen to sign in with one click.
            </p>

            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
