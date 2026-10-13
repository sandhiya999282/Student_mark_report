import { AuthUser, EmailLog, EmailNotificationConfig } from "../types";

const EMAIL_CONFIG_KEY = "academic_analyzer_email_config_v1";
const EMAIL_LOGS_KEY = "academic_analyzer_email_logs_v1";
const UNREAD_EMAILS_COUNT_KEY = "academic_analyzer_unread_emails_count_v1";

// Default Institutional Mail Gateway configuration
export const DEFAULT_EMAIL_CONFIG: EmailNotificationConfig = {
  senderEmail: "portal-notifications@campus.edu",
  senderName: "AcademiaGrade Institutional Security Cell",
  replyToEmail: "dean-academics@campus.edu",
  smtpServer: "smtp.internal.campus.edu (TLS Port 587)",
  enableLoginAlerts: true,
  enableRegistrationWelcome: true,
  securityNotice: "Authorized Academic Staff Notification. Automatic email dispatched to faculty mailbox.",
};

/**
 * Fetch current email sender configuration
 */
export function getEmailConfig(): EmailNotificationConfig {
  try {
    const raw = localStorage.getItem(EMAIL_CONFIG_KEY);
    if (raw) {
      return { ...DEFAULT_EMAIL_CONFIG, ...JSON.parse(raw) };
    }
  } catch {
    // fallback
  }
  return DEFAULT_EMAIL_CONFIG;
}

/**
 * Save updated email configuration
 */
export function saveEmailConfig(config: EmailNotificationConfig): void {
  try {
    localStorage.setItem(EMAIL_CONFIG_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
}

/**
 * Retrieve all logged dispatch notices
 */
export function getEmailLogs(): EmailLog[] {
  try {
    const raw = localStorage.getItem(EMAIL_LOGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return [];
}

/**
 * Get most recently sent email log
 */
export function getLastSentEmail(): EmailLog | null {
  const logs = getEmailLogs();
  return logs.length > 0 ? logs[0] : null;
}

/**
 * Unread email badge count
 */
export function getUnreadEmailCount(): number {
  try {
    const raw = localStorage.getItem(UNREAD_EMAILS_COUNT_KEY);
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

export function setUnreadEmailCount(count: number): void {
  try {
    localStorage.setItem(UNREAD_EMAILS_COUNT_KEY, count.toString());
  } catch {
    // ignore
  }
}

export function markEmailsAsRead(): void {
  setUnreadEmailCount(0);
}

/**
 * Append an email log entry to persistent browser storage
 */
export function recordEmailLog(log: EmailLog): void {
  try {
    const existing = getEmailLogs();
    const updated = [log, ...existing].slice(0, 50); // keep recent 50
    localStorage.setItem(EMAIL_LOGS_KEY, JSON.stringify(updated));

    // increment unread count
    const currentUnread = getUnreadEmailCount();
    setUnreadEmailCount(currentUnread + 1);

    // Trigger window event so user-side UI responds instantly in real-time
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("academic_portal_email_sent", { detail: log })
      );
    }
  } catch {
    // ignore
  }
}

/**
 * Clears email notification dispatch history
 */
export function clearEmailLogs(): void {
  try {
    localStorage.removeItem(EMAIL_LOGS_KEY);
    setUnreadEmailCount(0);
  } catch {
    // ignore
  }
}

/**
 * Dispatches the email to backend /api/email/dispatch for genuine server-side transmission logging
 */
export async function sendEmailToBackend(log: EmailLog): Promise<boolean> {
  try {
    const res = await fetch("/api/email/dispatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: log.to,
        from: log.from,
        subject: log.subject,
        category: log.category,
        bodySnippet: log.bodySnippet,
        htmlContent: log.htmlContent,
        metadata: log.metadata,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      log.backendDelivered = true;
      if (data.messageId) {
        log.messageId = data.messageId;
      }
      return true;
    }
  } catch (err) {
    console.warn("Backend email dispatch error (offline/local fallback):", err);
  }
  return false;
}

/**
 * Dispatches an automated login security notification to the faculty's registered mail ID
 */
export function dispatchLoginNotificationEmail(
  user: AuthUser,
  sourceLocation: string = "Campus Portal Web Interface (10.14.8.92)"
): EmailLog {
  const config = getEmailConfig();
  const timestamp = new Date().toISOString();
  const formattedTime = new Date().toLocaleString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });

  const subject = `[Campus Security] Successful Login Notification - ${user.name} (${user.staffId})`;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 24px 28px; color: #ffffff;">
        <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #a5b4fc; font-weight: 700;">Institutional Academic Notification</p>
        <h2 style="margin: 6px 0 0; font-size: 20px; font-weight: 800; color: #ffffff;">Staff Portal Login Alert</h2>
      </div>
      
      <div style="padding: 24px 28px; color: #1e293b; line-height: 1.6;">
        <p style="font-size: 15px; margin-top: 0;">Dear <strong>${user.name}</strong>,</p>
        <p style="font-size: 13.5px; color: #334155;">
          This official notification confirms that your academic credentials were used to sign in to the 
          <strong>Student Marks & Arrear Analytics Portal</strong>.
        </p>

        <!-- Notification Details Card -->
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 13px;">
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 14px; font-weight: 600; color: #64748b; width: 38%;">Sender Service:</td>
              <td style="padding: 10px 14px; color: #0f172a; font-family: monospace; font-weight: bold;">${config.senderEmail}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 14px; font-weight: 600; color: #64748b;">Recipient Mail ID:</td>
              <td style="padding: 10px 14px; color: #065f46; font-weight: bold; background: #ecfdf5;">${user.email}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 14px; font-weight: 600; color: #64748b;">Staff ID / Designation:</td>
              <td style="padding: 10px 14px; color: #0f172a;">${user.staffId} (${user.role})</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 14px; font-weight: 600; color: #64748b;">Assigned Department:</td>
              <td style="padding: 10px 14px; color: #0f172a;">${user.department}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 14px; font-weight: 600; color: #64748b;">Login Timestamp:</td>
              <td style="padding: 10px 14px; color: #0f172a;">${formattedTime}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; font-weight: 600; color: #64748b;">Network Session:</td>
              <td style="padding: 10px 14px; color: #0f172a;">${sourceLocation}</td>
            </tr>
          </tbody>
        </table>

        <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; margin: 20px 0; font-size: 12.5px; color: #92400e;">
          <strong>Security Notice:</strong> If you did not initiate this login session, please immediately notify the 
          Controller of Examinations or IT Cell via <a href="mailto:${config.replyToEmail}" style="color: #b45309; font-weight: bold;">${config.replyToEmail}</a> 
          to suspend unauthorized access to student grade sheets.
        </div>

        <p style="font-size: 12px; color: #94a3b8; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 14px;">
          Dispatched automatically from <strong>${config.senderName}</strong> (&lt;${config.senderEmail}&gt;). Replies sent to this message are routed to ${config.replyToEmail}.
        </p>
      </div>
    </div>
  `;

  const bodySnippet = `Login alert for ${user.name} (${user.staffId}) sent from ${config.senderEmail} to ${user.email} at ${formattedTime}.`;

  const logEntry: EmailLog = {
    id: `mail_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp,
    from: `${config.senderName} <${config.senderEmail}>`,
    to: user.email,
    recipientName: user.name,
    subject,
    category: "LOGIN_VERIFICATION",
    bodySnippet,
    htmlContent,
    status: "DELIVERED",
    messageId: `<auth-${Date.now()}@campus.edu>`,
    metadata: {
      staffId: user.staffId,
      role: user.role,
      loginTime: formattedTime,
      ipAddress: "10.14.8.92 (Campus Intranet)",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent.substring(0, 60) : "Browser Client",
    },
  };

  recordEmailLog(logEntry);
  sendEmailToBackend(logEntry); // Trigger server delivery

  return logEntry;
}

/**
 * Dispatches a registration welcome confirmation email to newly created faculty accounts
 */
export function dispatchRegistrationEmail(user: AuthUser): EmailLog {
  const config = getEmailConfig();
  const timestamp = new Date().toISOString();
  const formattedTime = new Date().toLocaleString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const subject = `[Welcome] Academic Portal Account Confirmation - ${user.name}`;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #065f46 0%, #047857 100%); padding: 24px 28px; color: #ffffff;">
        <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #a7f3d0; font-weight: 700;">Account Credentials Registered</p>
        <h2 style="margin: 6px 0 0; font-size: 20px; font-weight: 800; color: #ffffff;">Welcome to Student Academic Portal</h2>
      </div>
      
      <div style="padding: 24px 28px; color: #1e293b; line-height: 1.6;">
        <p style="font-size: 15px; margin-top: 0;">Welcome <strong>${user.name}</strong>,</p>
        <p style="font-size: 13.5px; color: #334155;">
          Your academic profile has been registered in the system. You now have full access to view, analyze, upload, and download master student grade sheets and arrear registers.
        </p>

        <!-- Account Specs -->
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 13px;">
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 14px; font-weight: 600; color: #64748b; width: 38%;">Sent From:</td>
              <td style="padding: 10px 14px; color: #0f172a; font-family: monospace;">${config.senderEmail}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 14px; font-weight: 600; color: #64748b;">Registered Mail ID:</td>
              <td style="padding: 10px 14px; color: #047857; font-weight: bold;">${user.email}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 14px; font-weight: 600; color: #64748b;">Staff / Employee ID:</td>
              <td style="padding: 10px 14px; color: #0f172a; font-mono font-bold;">${user.staffId}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 14px; font-weight: 600; color: #64748b;">Department:</td>
              <td style="padding: 10px 14px; color: #0f172a;">${user.department}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; font-weight: 600; color: #64748b;">Designation / Role:</td>
              <td style="padding: 10px 14px; color: #0f172a;">${user.role}</td>
            </tr>
          </tbody>
        </table>

        <p style="font-size: 13px; color: #475569;">
          You can sign in anytime using your registered email address <strong>${user.email}</strong> or Staff ID <strong>${user.staffId}</strong>.
        </p>

        <p style="font-size: 12px; color: #94a3b8; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 14px;">
          Dispatched from <strong>${config.senderName}</strong> (${config.senderEmail}) at ${formattedTime}.
        </p>
      </div>
    </div>
  `;

  const bodySnippet = `Registration confirmation for ${user.name} sent from ${config.senderEmail} to ${user.email}.`;

  const logEntry: EmailLog = {
    id: `mail_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp,
    from: `${config.senderName} <${config.senderEmail}>`,
    to: user.email,
    recipientName: user.name,
    subject,
    category: "REGISTRATION_WELCOME",
    bodySnippet,
    htmlContent,
    status: "DELIVERED",
    messageId: `<welcome-${Date.now()}@campus.edu>`,
    metadata: {
      staffId: user.staffId,
      role: user.role,
      loginTime: formattedTime,
    },
  };

  recordEmailLog(logEntry);
  sendEmailToBackend(logEntry);

  return logEntry;
}

/**
 * Generate quick Gmail compose / webmail preview URL
 */
export function getGmailWebmailUrl(log: EmailLog): string {
  const plainText = `Institutional Portal Alert\n\nSubject: ${log.subject}\nFrom: ${log.from}\nTo: ${log.to}\nDate: ${new Date(log.timestamp).toLocaleString()}\n\n${log.bodySnippet}\n\n[Security Alert]: Login was performed via Campus Academic Portal.`;
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(log.to)}&su=${encodeURIComponent(log.subject)}&body=${encodeURIComponent(plainText)}`;
}

/**
 * Generate standard mailto link
 */
export function getMailtoUrl(log: EmailLog): string {
  const plainText = `Notification:\nSubject: ${log.subject}\nFrom: ${log.from}\nTo: ${log.to}\n\n${log.bodySnippet}`;
  return `mailto:${encodeURIComponent(log.to)}?subject=${encodeURIComponent(log.subject)}&body=${encodeURIComponent(plainText)}`;
}
