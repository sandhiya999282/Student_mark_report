import React, { useState, useEffect } from "react";
import {
  Mail,
  CheckCircle2,
  ExternalLink,
  X,
  ShieldCheck,
  Send,
  Eye,
  Sparkles,
} from "lucide-react";
import { EmailLog, AuthUser } from "../types";
import {
  getLastSentEmail,
  getGmailWebmailUrl,
  getMailtoUrl,
} from "../utils/emailNotificationService";

interface UserEmailNotificationBannerProps {
  currentUser: AuthUser | null;
  onOpenEmailModal: (log?: EmailLog) => void;
}

export const UserEmailNotificationBanner: React.FC<UserEmailNotificationBannerProps> = ({
  currentUser,
  onOpenEmailModal,
}) => {
  const [activeLog, setActiveLog] = useState<EmailLog | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Check on mount if an email was sent recently (e.g. during current login in last 45 seconds)
  useEffect(() => {
    if (!currentUser) return;

    const recent = getLastSentEmail();
    if (recent) {
      const logTime = new Date(recent.timestamp).getTime();
      const now = Date.now();
      // If sent within the last 60 seconds and addressed to current user
      if (now - logTime < 60000 && recent.to.toLowerCase() === currentUser.email.toLowerCase()) {
        setActiveLog(recent);
        setIsVisible(true);
      }
    }
  }, [currentUser]);

  // Listen to real-time custom event triggered by emailNotificationService
  useEffect(() => {
    const handleEmailSent = (e: Event) => {
      const customEvent = e as CustomEvent<EmailLog>;
      if (customEvent.detail) {
        setActiveLog(customEvent.detail);
        setIsVisible(true);
        setIsDismissed(false);
      }
    };

    window.addEventListener("academic_portal_email_sent", handleEmailSent);
    return () => {
      window.removeEventListener("academic_portal_email_sent", handleEmailSent);
    };
  }, []);

  if (!isVisible || !activeLog || isDismissed) {
    return null;
  }

  const gmailUrl = getGmailWebmailUrl(activeLog);
  const mailtoUrl = getMailtoUrl(activeLog);

  return (
    <div
      id="user-auto-email-alert-banner"
      className="fixed bottom-6 right-6 z-50 max-w-md w-full bg-slate-900 text-white rounded-2xl shadow-2xl border border-indigo-500/40 p-4.5 animate-in fade-in slide-in-from-bottom-5 duration-300 backdrop-blur-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30">
            <Mail className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Email Sent Automatically
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                User Side Delivered
              </span>
            </div>
            <h4 className="text-sm font-extrabold text-white mt-0.5 leading-snug">
              {activeLog.subject}
            </h4>
            <p className="text-xs text-slate-300 mt-1">
              Sent to: <strong className="text-emerald-300 font-mono">{activeLog.to}</strong>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              From: <span className="font-mono text-indigo-200">portal-notifications@campus.edu</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsDismissed(true)}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          title="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Action buttons on user side */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onOpenEmailModal(activeLog)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-sm"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Email</span>
          </button>

          <a
            href={gmailUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer border border-slate-700"
            title="Open mail compose/search in Gmail Web"
          >
            <span>Gmail</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>

          <a
            href={mailtoUrl}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer border border-slate-700"
            title="Open in default desktop/mobile email client"
          >
            <span>Mail App</span>
          </a>
        </div>

        <span className="text-[10px] text-slate-400 font-mono">
          {new Date(activeLog.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
};
