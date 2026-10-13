import React, { useState, useEffect } from "react";
import {
  Mail,
  ShieldCheck,
  Send,
  CheckCircle2,
  Clock,
  User,
  ExternalLink,
  ChevronRight,
  Eye,
  Trash2,
  X,
  Building,
  Key,
  Server,
  RefreshCw,
  Info,
  Copy,
  Sparkles,
} from "lucide-react";
import { EmailLog, EmailNotificationConfig, AuthUser } from "../types";
import {
  getEmailConfig,
  saveEmailConfig,
  getEmailLogs,
  clearEmailLogs,
  dispatchLoginNotificationEmail,
  getGmailWebmailUrl,
  getMailtoUrl,
  markEmailsAsRead,
} from "../utils/emailNotificationService";

interface EmailNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  initialSelectedLog?: EmailLog | null;
  onNotification?: (msg: string, type: "success" | "info" | "warning") => void;
}

export const EmailNotificationModal: React.FC<EmailNotificationModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialSelectedLog,
  onNotification,
}) => {
  const [config, setConfig] = useState<EmailNotificationConfig>(getEmailConfig());
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);
  const [activeTab, setActiveTab] = useState<"logs" | "sender_config" | "preview">("logs");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [customTestEmail, setCustomTestEmail] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Load logs on open
  useEffect(() => {
    if (isOpen) {
      const storedLogs = getEmailLogs();
      setLogs(storedLogs);
      setConfig(getEmailConfig());
      markEmailsAsRead();

      if (initialSelectedLog) {
        setSelectedLog(initialSelectedLog);
      } else if (storedLogs.length > 0) {
        setSelectedLog(storedLogs[0]);
      }

      if (currentUser?.email) {
        setCustomTestEmail(currentUser.email);
      }
    }
  }, [isOpen, initialSelectedLog, currentUser]);

  if (!isOpen) return null;

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveEmailConfig(config);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
    if (onNotification) {
      onNotification("Sender email settings updated successfully.", "success");
    }
  };

  const handleSendTestAlert = (targetEmail?: string) => {
    const emailToUse = targetEmail || customTestEmail || (currentUser ? currentUser.email : "faculty@campus.edu");
    setIsSendingTest(true);

    const testUser: AuthUser = currentUser
      ? { ...currentUser, email: emailToUse }
      : {
          id: "usr_test",
          email: emailToUse,
          name: "Faculty Member",
          role: "Faculty / Professor",
          department: "Computer Science & Engineering",
          staffId: "FAC-8821",
          registeredAt: new Date().toISOString(),
        };

    setTimeout(() => {
      const newLog = dispatchLoginNotificationEmail(
        testUser,
        "Direct Portal Email Dispatch (Verified Gateway)"
      );
      const updatedLogs = getEmailLogs();
      setLogs(updatedLogs);
      setSelectedLog(newLog);
      setIsSendingTest(false);
      if (onNotification) {
        onNotification(
          `Automated login security alert dispatched to ${emailToUse}!`,
          "success"
        );
      }
    }, 350);
  };

  const handleClearLogs = () => {
    if (window.confirm("Are you sure you want to clear the email dispatch log history?")) {
      clearEmailLogs();
      setLogs([]);
      setSelectedLog(null);
    }
  };

  const handleCopyBody = () => {
    if (!selectedLog) return;
    navigator.clipboard.writeText(
      `Subject: ${selectedLog.subject}\nFrom: ${selectedLog.from}\nTo: ${selectedLog.to}\nDate: ${new Date(selectedLog.timestamp).toLocaleString()}\n\n${selectedLog.bodySnippet}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/80 border border-indigo-400/40 flex items-center justify-center shadow-inner">
              <Mail className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-base">
                  Faculty Email Notification Center
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Automated User Delivery Active
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Outbound sender mail verification & automated delivery to user email address
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sender & Recipient Identity Summary Banner */}
        <div className="bg-indigo-50/70 border-b border-indigo-100 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-6 flex-wrap">
            <div>
              <span className="text-slate-500 font-medium">Notifications Sent From:</span>
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <Server className="w-3.5 h-3.5 text-indigo-600" />
                <code className="text-indigo-800 bg-indigo-100/70 px-1.5 py-0.5 rounded text-[11px]">
                  {config.senderEmail}
                </code>
              </div>
            </div>

            <div className="h-6 w-px bg-indigo-200 hidden sm:block" />

            <div>
              <span className="text-slate-500 font-medium">Target User Email:</span>
              <div className="flex items-center gap-1.5 font-bold text-emerald-700">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <code className="text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded text-[11px]">
                  {currentUser ? currentUser.email : "user@email.com"}
                </code>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSendTestAlert()}
              disabled={isSendingTest}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSendingTest ? "Sending Alert..." : "Send Automated Alert Now"}</span>
            </button>
          </div>
        </div>

        {/* Nav tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/60 px-6 pt-2 gap-2 text-xs">
          <button
            onClick={() => setActiveTab("logs")}
            className={`py-2 px-3 font-semibold rounded-t-lg border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "logs"
                ? "border-indigo-600 text-indigo-700 bg-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Dispatched Emails History</span>
            <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-[10px] font-bold">
              {logs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("sender_config")}
            className={`py-2 px-3 font-semibold rounded-t-lg border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "sender_config"
                ? "border-indigo-600 text-indigo-700 bg-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Sender Email & Gateway Settings</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === "logs" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Left Column: Email Log Feed */}
              <div className="md:col-span-5 border border-slate-200 rounded-xl overflow-hidden flex flex-col bg-slate-50/30">
                <div className="px-3.5 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Delivered Login Notifications</span>
                  {logs.length > 0 && (
                    <button
                      onClick={handleClearLogs}
                      className="text-rose-600 hover:text-rose-800 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear
                    </button>
                  )}
                </div>

                <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
                  {logs.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      <Mail className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-600">No emails logged yet</p>
                      <p className="mt-1">
                        Sign in or click "Send Automated Alert Now" to dispatch an email to the user side.
                      </p>
                    </div>
                  ) : (
                    logs.map((item) => {
                      const isSelected = selectedLog?.id === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedLog(item)}
                          className={`p-3 text-left transition-colors cursor-pointer text-xs ${
                            isSelected
                              ? "bg-indigo-50/90 border-l-4 border-indigo-600 text-indigo-900"
                              : "hover:bg-slate-100/70 text-slate-800"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-bold truncate text-slate-900">
                              {item.recipientName}
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {new Date(item.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-mono mb-1 truncate">
                            <span>To: {item.to}</span>
                          </div>

                          <p className="text-[11px] text-slate-500 line-clamp-1">
                            {item.subject}
                          </p>

                          <div className="mt-1.5 flex items-center justify-between gap-2">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              Delivered to User
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">
                              From: {config.senderEmail}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Detailed Email Inspection View */}
              <div className="md:col-span-7 flex flex-col border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                {selectedLog ? (
                  <div>
                    {/* Message Header */}
                    <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-2.5 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-extrabold text-sm text-slate-900 leading-snug">
                          {selectedLog.subject}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 shrink-0">
                          {selectedLog.category}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/80">
                        <div>
                          <strong className="text-slate-700">From (Sender):</strong>{" "}
                          <span className="font-mono text-indigo-700 font-medium">{selectedLog.from}</span>
                        </div>
                        <div>
                          <strong className="text-slate-700">To (User):</strong>{" "}
                          <span className="font-mono text-emerald-700 font-bold">{selectedLog.to}</span>
                        </div>
                        <div>
                          <strong className="text-slate-700">Date Dispatched:</strong>{" "}
                          <span>{new Date(selectedLog.timestamp).toLocaleString()}</span>
                        </div>
                        <div>
                          <strong className="text-slate-700">Gateway Status:</strong>{" "}
                          <span className="text-emerald-700 font-bold">250 OK (Auto-Sent)</span>
                        </div>
                      </div>

                      {/* Quick mail client actions */}
                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        <a
                          href={getGmailWebmailUrl(selectedLog)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          title="Open in Gmail Webmail"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Open in Gmail</span>
                        </a>

                        <a
                          href={getMailtoUrl(selectedLog)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          title="Open in default desktop or phone mail app"
                        >
                          <Mail className="w-3 h-3 text-slate-600" />
                          <span>Default Mail App</span>
                        </a>

                        <button
                          onClick={handleCopyBody}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <Copy className="w-3 h-3 text-slate-600" />
                          <span>{copied ? "Copied!" : "Copy Text"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Email HTML Body Render */}
                    <div className="p-4 max-h-[340px] overflow-y-auto bg-slate-100/50">
                      <div
                        className="bg-white p-3 rounded-lg shadow-inner text-xs border border-slate-200"
                        dangerouslySetInnerHTML={{ __html: selectedLog.htmlContent }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-400 my-auto">
                    <Eye className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600 text-xs">Select an email to view full content</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Inspect the sender headers, recipient email address, and notification layout.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "sender_config" && (
            <form onSubmit={handleSaveConfig} className="max-w-2xl mx-auto space-y-5 text-xs">
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <strong className="font-bold">Automated User-Side Delivery Policy:</strong>
                  <p className="mt-1 text-blue-800">
                    Whenever any faculty member signs in or registers, an automated login verification email is 
                    dispatched immediately to their personal or institutional email address (e.g. <code>sandhiya.g567@gmail.com</code>). 
                    The notification originates from the designated sender mail address configured below.
                  </p>
                </div>
              </div>

              <div className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Outbound Mail Gateway (Sender Details)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Sender Email (From Mail ID)
                    </label>
                    <input
                      type="email"
                      value={config.senderEmail}
                      onChange={(e) => setConfig({ ...config, senderEmail: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                      placeholder="portal-notifications@campus.edu"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      The exact email address that faculty will see in the "From:" line.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Sender Organization Display Name
                    </label>
                    <input
                      type="text"
                      value={config.senderName}
                      onChange={(e) => setConfig({ ...config, senderName: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                      placeholder="AcademiaGrade Institutional Security Cell"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Official sender entity shown in email apps.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Reply-To Email Address
                    </label>
                    <input
                      type="email"
                      value={config.replyToEmail}
                      onChange={(e) => setConfig({ ...config, replyToEmail: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                      placeholder="dean-academics@campus.edu"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Where faculty replies or security escalation inquiries are directed.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      SMTP Relay / Gateway Server
                    </label>
                    <input
                      type="text"
                      value={config.smtpServer}
                      onChange={(e) => setConfig({ ...config, smtpServer: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                      placeholder="smtp.internal.campus.edu (TLS 587)"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Campus or institutional SMTP relay host.
                    </p>
                  </div>
                </div>
              </div>

              {/* Automation Toggles */}
              <div className="space-y-3 bg-slate-50 p-5 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Automated Triggers
                </h4>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enableLoginAlerts}
                    onChange={(e) => setConfig({ ...config, enableLoginAlerts: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded-sm focus:ring-indigo-500"
                  />
                  <div>
                    <span className="font-bold text-slate-800">
                      Send automatic security alert email upon faculty login
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Dispatches an automated email to the faculty member's registered mail address every time they sign in.
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer pt-2 border-t border-slate-200">
                  <input
                    type="checkbox"
                    checked={config.enableRegistrationWelcome}
                    onChange={(e) =>
                      setConfig({ ...config, enableRegistrationWelcome: e.target.checked })
                    }
                    className="w-4 h-4 text-indigo-600 rounded-sm focus:ring-indigo-500"
                  />
                  <div>
                    <span className="font-bold text-slate-800">
                      Send automatic welcome & credentials email upon registration
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Sends account details and staff credentials confirmation to newly registered faculty.
                    </p>
                  </div>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                {isSaved && (
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Saved!
                  </span>
                )}
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
                >
                  Save Gateway Settings
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Automatic User-Side Delivery: <strong>ACTIVE</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
