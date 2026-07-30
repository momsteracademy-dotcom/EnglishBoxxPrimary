import React, { useState, useEffect } from "react";
import { 
  Database, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  X, 
  ShieldCheck, 
  Activity, 
  Server, 
  Cpu, 
  Key, 
  Layers, 
  FileText, 
  Clock, 
  AlertTriangle,
  Info
} from "lucide-react";

interface SystemStatusData {
  database: {
    primary: string;
    supabaseConnection: "Connected" | "Disconnected";
    supabaseError: string | null;
    currentAppId: string;
  };
  questionBank: {
    dataSource: string;
    table: string;
    statusFilter: string;
  };
  worksheets: {
    dataSource: string;
    table: string;
  };
  fallback: {
    firestore: string;
    localJson: string;
  };
  authentication: {
    status: string;
    provider: string;
  };
  ai: {
    geminiApi: string;
  };
  imageGeneration: {
    status: string;
  };
  environment: string;
}

interface DbActivityLog {
  id: string;
  operation: "SELECT" | "INSERT" | "UPDATE" | "DELETE" | "UPSERT";
  table: string;
  database: "Supabase" | "Firestore" | "Local JSON";
  timestamp: string;
  app_id: string;
  success: boolean;
  error?: string;
  details?: string;
}

interface SystemStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SystemStatusModal({ isOpen, onClose }: SystemStatusModalProps) {
  const [statusData, setStatusData] = useState<SystemStatusData | null>(null);
  const [logs, setLogs] = useState<DbActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "logs">("overview");

  const fetchSystemStatus = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [resStatus, resLogs] = await Promise.all([
        fetch("/api/system-status"),
        fetch("/api/system-status/logs")
      ]);

      if (resStatus.ok) {
        const data = await resStatus.json();
        setStatusData(data);
      } else {
        setErrorMsg("Failed to fetch system status");
      }

      if (resLogs.ok) {
        const logsData = await resLogs.json();
        setLogs(logsData);
      }
    } catch (err: any) {
      console.error("SystemStatus fetch error:", err);
      setErrorMsg(err.message || "Network error fetching system status");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSystemStatus();
      const interval = setInterval(() => {
        fetchSystemStatus();
      }, 5000); // Auto refresh every 5 seconds when open
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isConnected = statusData?.database?.supabaseConnection === "Connected";

  const getOpBadgeClass = (op: string) => {
    switch (op) {
      case "SELECT": return "bg-blue-100 text-blue-800 border-blue-200";
      case "INSERT": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "UPSERT": return "bg-purple-100 text-purple-800 border-purple-200";
      case "UPDATE": return "bg-amber-100 text-amber-800 border-amber-200";
      case "DELETE": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight">System Status & Database Inspector</h2>
                <span className="bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                  DEV TOOL
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Real-time database connection, component health & activity logs</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchSystemStatus}
              disabled={isLoading}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer flex items-center gap-1.5 text-xs font-medium"
              title="Refresh status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-emerald-400" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-red-600/80 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-2 flex items-center justify-between text-xs font-semibold shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "overview"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200 font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>System Health & Config</span>
            </button>
            <button
              onClick={() => setActiveTab("logs")}
              className={`px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "logs"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200 font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span>Database Activity Log</span>
              {logs.length > 0 && (
                <span className="bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full text-[10px] font-mono">
                  {logs.length}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 text-slate-500 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Zero Credentials Exposed</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/50">
          
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 text-xs font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <div>
                <p className="font-bold">System Status Error</p>
                <p className="text-red-600">{errorMsg}</p>
              </div>
            </div>
          )}

          {activeTab === "overview" && (
            <div className="space-y-6">
              
              {/* Primary Database Status */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2.5">
                    <Database className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-bold text-slate-800 text-sm">Database Configuration</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {isConnected ? (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Connected
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-800 border border-red-300 text-xs font-bold">
                        <XCircle className="w-3.5 h-3.5 text-red-600" />
                        Disconnected
                      </span>
                    )}
                  </div>
                </div>

                {statusData?.database?.supabaseError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-mono">
                    <p className="font-bold mb-0.5">Connection Error Details:</p>
                    {statusData.database.supabaseError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-500 font-medium block mb-1">Primary Database</span>
                    <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-emerald-600" />
                      {statusData?.database?.primary || "Supabase"}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-500 font-medium block mb-1">Current App ID</span>
                    <span className="font-mono font-bold text-slate-800 text-sm bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200 inline-block">
                      {statusData?.database?.currentAppId || "englishboxx"}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-500 font-medium block mb-1">Supabase Status</span>
                    <span className={`font-bold text-sm ${isConnected ? "text-emerald-700" : "text-red-600"}`}>
                      {statusData?.database?.supabaseConnection || "Checking..."}
                    </span>
                  </div>
                </div>
              </div>

              {/* Data Sources Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Question Bank */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Question Bank</h4>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Data Source:</span>
                      <span className="font-bold text-slate-800">{statusData?.questionBank?.dataSource || "Supabase"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Table Name:</span>
                      <span className="font-mono font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">{statusData?.questionBank?.table || "public.question_bank"}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Status Filter Scope:</span>
                      <span className="font-medium text-slate-700">{statusData?.questionBank?.statusFilter || "approved / pending"}</span>
                    </div>
                  </div>
                </div>

                {/* Worksheets */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Worksheets Library</h4>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Data Source:</span>
                      <span className="font-bold text-slate-800">{statusData?.worksheets?.dataSource || "Supabase"}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Table Name:</span>
                      <span className="font-mono font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">{statusData?.worksheets?.table || "public.worksheets"}</span>
                    </div>
                  </div>
                </div>

                {/* Fallback Systems */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Fallback & Backup</h4>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Firestore Cloud:</span>
                      <span className="font-semibold text-slate-700">{statusData?.fallback?.firestore || "Available"}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Local JSON Storage:</span>
                      <span className="font-semibold text-emerald-700">{statusData?.fallback?.localJson || "Available"}</span>
                    </div>
                  </div>
                </div>

                {/* Authentication & AI */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                    <Cpu className="w-4 h-4 text-purple-600" />
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Services & AI</h4>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Auth Status:</span>
                      <span className="font-semibold text-slate-800">{statusData?.authentication?.status || "Configured"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Auth Provider:</span>
                      <span className="font-medium text-slate-700">{statusData?.authentication?.provider || "Custom Session"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Gemini AI API:</span>
                      <span className="font-bold text-emerald-700">{statusData?.ai?.geminiApi || "Configured"}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Image Generation:</span>
                      <span className="font-medium text-slate-500">{statusData?.imageGeneration?.status || "Not Configured"}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Environment info */}
              <div className="bg-slate-100 rounded-xl p-3 border border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-slate-500" />
                  <span>Environment Mode: <strong className="text-slate-800">{statusData?.environment || "Development / Preview"}</strong></span>
                </div>
                <span className="font-mono text-[11px] text-slate-500">App: englishboxx</span>
              </div>

            </div>
          )}

          {activeTab === "logs" && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Database Operations Log</h3>
                  <p className="text-xs text-slate-500">Real-time log of database queries (SELECT, INSERT, UPDATE, DELETE, UPSERT)</p>
                </div>
                <span className="text-xs font-mono text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                  Total: {logs.length} entries
                </span>
              </div>

              {logs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-medium">
                  No database activity logged yet in this session. Perform a query (e.g. generate worksheet or fetch question bank) to see live logs.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200">
                        <th className="py-2.5 px-3">Op</th>
                        <th className="py-2.5 px-3">Table</th>
                        <th className="py-2.5 px-3">Database</th>
                        <th className="py-2.5 px-3">App ID</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Time</th>
                        <th className="py-2.5 px-3">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getOpBadgeClass(log.operation)}`}>
                              {log.operation}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-800 font-semibold">{log.table}</td>
                          <td className="py-2 px-3 text-slate-600">{log.database}</td>
                          <td className="py-2 px-3 text-emerald-700">{log.app_id}</td>
                          <td className="py-2 px-3">
                            {log.success ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                                <CheckCircle2 className="w-3 h-3" /> Success
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-600 font-bold text-[11px]">
                                <XCircle className="w-3 h-3" /> Error
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-slate-400 text-[11px]">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="py-2 px-3 text-slate-500 font-sans text-[11px] max-w-xs truncate" title={log.error || log.details || ""}>
                            {log.error ? (
                              <span className="text-red-600 font-mono">{log.error}</span>
                            ) : (
                              log.details || "-"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>EnglishBoxx Primary System Status Inspector</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-medium cursor-pointer"
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
}
