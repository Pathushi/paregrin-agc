import React, { useState, useEffect } from "react";
import { Database, AlertTriangle } from "lucide-react";
import axios from "axios";

const StorageControlManager = () => {
  const [storageAccounts, setStorageAccounts] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [targetAction, setTargetAction] = useState("");

  const fetchStorageAccounts = async () => {
    try {
      const res = await axios.get(
        "http://13.48.84.7/api/storage-accounts/discover/",
      );
      setStorageAccounts(res.data.accounts || res.data);
    } catch (err) {
      console.error("Failed to discover storage accounts", err);
    }
  };

  const fetchAuditLogs = async (page = 1) => {
    setLoadingLogs(true);
    try {
      const res = await axios.get(
        `http://13.48.84.7/api/agc-audit-logs/?page=${page}`,
      );
      const allResults =
        res.data.results || (Array.isArray(res.data) ? res.data : []);

      const storageFiltered = allResults.filter((log) => {
        const text = (log.action || "").toLowerCase();
        return text.includes("storage") || text.includes("blob");
      });

      setAuditLogs(storageFiltered);
      setTotalPages(res.data.total_pages || 1);
      setCurrentPage(res.data.current_page || page);
    } catch (err) {
      console.error("Failed to fetch audit history", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchStorageAccounts();
    fetchAuditLogs(1);
  }, []);

  const openConfirmation = (account, action) => {
    setSelectedAccount(account);
    setTargetAction(action);
    setModalOpen(true);
  };

  const confirmAction = async () => {
    if (!selectedAccount) return;
    try {
      await axios.post(
        `http://13.48.84.7/api/storage-accounts/${selectedAccount.id}/execute-action/`,
        {
          action_type: targetAction,
          user_id: sessionStorage.getItem("user_id"), // <-- ADDED
        },
      );
      fetchStorageAccounts();
      fetchAuditLogs(currentPage);
    } catch (err) {
      alert("Failed to modify storage account access.");
    } finally {
      setModalOpen(false);
      setSelectedAccount(null);
    }
  };

  const enabledCount = storageAccounts.filter(
    (s) => s.status === "ENABLED",
  ).length;
  const disabledCount = storageAccounts.filter(
    (s) => s.status === "DISABLED",
  ).length;

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Active Storage Accounts
          </p>
          <p className="text-3xl font-black text-slate-900 mt-1">
            {enabledCount}
          </p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Disabled / Locked Access
          </p>
          <p className="text-3xl font-black text-slate-900 mt-1">
            {disabledCount}
          </p>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Database size={16} className="text-slate-400" /> Authorized Azure
          Storage Resources
        </h3>
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
              <th className="py-3 px-4">Storage Account Name</th>
              <th className="py-3 px-4">Resource Group</th>
              <th className="py-3 px-4">Access Status</th>
              <th className="py-3 px-4 text-right">Portal Controls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {storageAccounts.length === 0 ? (
              <tr>
                <td
                  colSpan="4"
                  className="py-8 text-center text-slate-400 italic"
                >
                  No storage accounts discovered from subscription.
                </td>
              </tr>
            ) : (
              storageAccounts.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {s.name}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {s.resource_group}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${s.status === "ENABLED" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {s.status === "ENABLED" ? (
                      <button
                        onClick={() => openConfirmation(s, "disable")}
                        className="px-3 py-1 bg-red-50 text-red-700 rounded-xl text-[10px] font-bold uppercase"
                      >
                        Disable Access
                      </button>
                    ) : (
                      <button
                        onClick={() => openConfirmation(s, "enable")}
                        className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-bold uppercase"
                      >
                        Enable Access
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Audit Trail */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">
            Storage Security Audit Trail
          </h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Showing latest entries (10 per page)
          </span>
        </div>
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
              <th className="py-3 px-4">Date & Time</th>
              <th className="py-3 px-4">Activity</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Operator</th>
              <th className="py-3 px-4">Target Resource</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {loadingLogs ? (
              <tr>
                <td
                  colSpan="5"
                  className="py-8 text-center text-slate-400 italic"
                >
                  Loading storage audit entries...
                </td>
              </tr>
            ) : auditLogs.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="py-8 text-center text-slate-400 italic"
                >
                  No storage operations recorded yet.
                </td>
              </tr>
            ) : (
              auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-mono text-slate-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {log.action}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        log.status.toLowerCase() === "success"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{log.username}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500 truncate max-w-xs">
                    {log.target_resource}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Bar */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
          <button
            onClick={() => fetchAuditLogs(currentPage - 1)}
            disabled={currentPage === 1 || loadingLogs}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-bold uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Previous
          </button>
          <span className="text-xs font-bold text-slate-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => fetchAuditLogs(currentPage + 1)}
            disabled={currentPage === totalPages || loadingLogs}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-bold uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Next
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <div className="text-center">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                Confirm Storage Access Change
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                You are about to{" "}
                <strong className="uppercase text-slate-800">
                  {targetAction}
                </strong>{" "}
                access for{" "}
                <strong className="text-slate-800">
                  {selectedAccount?.name}
                </strong>
                . Existing storage data will be preserved safely.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold uppercase"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase shadow-lg"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StorageControlManager;
