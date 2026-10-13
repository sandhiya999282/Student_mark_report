import React from "react";
import {
  FileSpreadsheet,
  Download,
  Upload,
  Sparkles,
  Settings,
  LayoutDashboard,
  Users,
  TrendingUp,
  Award,
  AlertCircle,
  Trash2,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Mail,
} from "lucide-react";
import { SystemConfig, AuthUser } from "../types";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  config: SystemConfig;
  onOpenUpload: () => void;
  onDownloadExcel: () => void;
  onOpenSettings: () => void;
  onOpenAiAdvisor: () => void;
  totalStudents: number;
  arrearCount?: number;
  onClearRecords?: () => void;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  onOpenEmailCenter?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  config,
  onOpenUpload,
  onDownloadExcel,
  onOpenSettings,
  onOpenAiAdvisor,
  totalStudents,
  arrearCount = 0,
  onClearRecords,
  currentUser,
  onLogout,
  onOpenEmailCenter,
}) => {
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "students", label: "Student Records", icon: Users, badge: totalStudents },
    { id: "arrears", label: "Arrear List", icon: AlertCircle, badge: arrearCount, isAlert: arrearCount > 0 },
    { id: "rankings", label: "Rankings", icon: Award },
    { id: "predictions", label: "Performance & Predictions", icon: TrendingUp },
    { id: "upload", label: "Upload & Validate", icon: Upload },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-lg">
                  Student<span className="text-indigo-600">Excel</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                  AI Auto-Update
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                {config.className} • {config.section} ({config.academicYear})
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Direct Arrear List Quick Button */}
            <button
              id="nav-arrear-list-btn"
              onClick={() => setActiveTab("arrears")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-bold rounded-lg border transition-all ${
                activeTab === "arrears"
                  ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                  : "text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200"
              }`}
              title="Open Arrear List section"
            >
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>Arrear List</span>
              {arrearCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    activeTab === "arrears"
                      ? "bg-white/20 text-white"
                      : "bg-rose-200 text-rose-900"
                  }`}
                >
                  {arrearCount}
                </span>
              )}
            </button>

            <button
              id="nav-ai-advisor-btn"
              onClick={onOpenAiAdvisor}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors shadow-xs"
              title="Open AI Pedagogical Advisor"
            >
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="hidden md:inline">AI Academic Advisor</span>
              <span className="md:hidden">AI Advisor</span>
            </button>

            <button
              id="nav-upload-btn"
              onClick={onOpenUpload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              title="Upload new or updated Excel file"
            >
              <Upload className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Upload Excel</span>
            </button>

            {totalStudents > 0 && onClearRecords && (
              <button
                id="nav-clear-records-btn"
                onClick={onClearRecords}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                title="Remove all previous/existing student records"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span className="hidden sm:inline">Clear Records</span>
              </button>
            )}

            <button
              id="nav-download-excel-btn"
              onClick={onDownloadExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm shadow-indigo-600/25 transition-all cursor-pointer"
              title="Download master student Excel file (.xlsx)"
            >
              <Download className="w-4 h-4" />
              <span>Download Updated Excel</span>
            </button>

            <button
              id="nav-settings-btn"
              onClick={onOpenSettings}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Configure passing marks, grading scales, and ranking methods"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Email Notification Center button */}
            <button
              id="nav-email-center-btn"
              onClick={onOpenEmailCenter}
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer relative"
              title="Faculty Email Notifications: Sender ID & Delivery Logs"
            >
              <Mail className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white"></span>
            </button>

            {/* User Profile & Sign Out */}
            {currentUser && (
              <div className="relative pl-1 border-l border-slate-200">
                <button
                  id="nav-user-profile-btn"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg hover:bg-slate-100 transition-colors text-left cursor-pointer border border-transparent hover:border-slate-200"
                  title="View your account details"
                >
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr ${
                      currentUser.avatarBg || "from-indigo-600 to-violet-700"
                    } text-white font-bold text-xs flex items-center justify-center shadow-2xs`}
                  >
                    {currentUser.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div className="hidden lg:block text-xs">
                    <p className="font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                      {currentUser.name}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate max-w-[120px]">
                      {currentUser.role.split("/")[0].trim()}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>

                {/* Profile dropdown modal / popover */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50 animate-fadeIn text-slate-800">
                    <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
                      <div
                        className={`w-10 h-10 rounded-full bg-gradient-to-tr ${
                          currentUser.avatarBg || "from-indigo-600 to-violet-700"
                        } text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs`}
                      >
                        {currentUser.name
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-slate-900 truncate">
                          {currentUser.name}
                        </h4>
                        <p className="text-xs text-indigo-600 font-semibold truncate">
                          {currentUser.role}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {currentUser.email}
                        </p>
                      </div>
                    </div>

                    <div className="py-2.5 space-y-1.5 text-xs text-slate-600 border-b border-slate-100">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Department:</span>
                        <span className="font-medium text-right text-slate-700 truncate max-w-[160px]">
                          {currentUser.department}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Staff ID:</span>
                        <span className="font-mono font-medium text-slate-700">
                          {currentUser.staffId}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Login Alerts:</span>
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 font-mono text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Enabled ({currentUser.email.split("@")[0]}...)
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 space-y-1.5">
                      {onOpenEmailCenter && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowProfileMenu(false);
                            onOpenEmailCenter();
                          }}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer border border-indigo-200"
                        >
                          <Mail className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Email Notification History</span>
                        </button>
                      )}

                      <button
                        type="button"
                        id="nav-logout-btn"
                        onClick={() => {
                          setShowProfileMenu(false);
                          if (onLogout) onLogout();
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-rose-200"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>Sign Out of Portal</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 border-t border-slate-100 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? tab.id === "arrears"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "bg-indigo-600 text-white shadow-xs"
                    : tab.id === "arrears" && (tab.badge || 0) > 0
                    ? "text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive
                      ? "text-white"
                      : tab.id === "arrears"
                      ? "text-rose-500"
                      : "text-slate-500"
                  }`}
                />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : tab.id === "arrears" && tab.badge > 0
                        ? "bg-rose-100 text-rose-800"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

