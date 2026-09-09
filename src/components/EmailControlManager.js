import React, { useState, useEffect } from "react";
import { Mail, ShieldAlert, AlertTriangle, Lock, Plus } from "lucide-react";
import { mailboxAPI } from "../services/api.js";
import axios from "axios";

const EmailControlManager = () => {
  const [mailboxes, setMailboxes] = useState([]);

  // Audit Trail & Pagination States
  const [auditLogs, setAuditLogs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMailbox, setSelectedMailbox] = useState(null);
  const [targetAction, setTargetAction] = useState("");

  // New Mailbox Form State
  const [newUpn, setNewUpn] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMailboxes = async () => {
    try {
      const res = await mailboxAPI.getMailboxes();
      setMailboxes(res.data);
    } catch (err) {
      console.error("Failed to fetch mailboxes", err);
    }
  };

  // Extract targeted email/UPN from log output strings
  const extractTargetEmail = (log) => {
    const text = log.full_logs || log.playbook_display || log.playbook || "";
    // Matches standard UPN pattern (e.g., something@domain.com)
    const emailMatch = text.match(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
    );
    return emailMatch ? emailMatch[0] : "N/A";
  };

  // Fetch real server logs, filter strictly for mail/email playbooks, and handle pagination (10 per page)
  const fetchAuditLogs = async (page = 1) => {
    setLoadingLogs(true);
    try {
      const res = await axios.get(
        `http://13.48.84.7/api/tasks/user-history/?page=${page}&limit=10`,
      );

      const allResults = res.data.results || [];
      const mailFilteredResults = allResults.filter((log) => {
        const text = (log.playbook_display || log.playbook || "").toLowerCase();
        return (
          text.includes("email") ||
          text.includes("mailbox") ||
          text.includes("block") ||
          text.includes("unblock") ||
          text.includes("wipe")
        );
      });

      setAuditLogs(mailFilteredResults);
      setTotalPages(res.data.total_pages || 1);
      setCurrentPage(res.data.current_page || page);
    } catch (err) {
      console.error("Failed to fetch audit history", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchMailboxes();
    fetchAuditLogs(1);
  }, []);

  const handleAddMailbox = async (e) => {
    e.preventDefault();
    if (!newUpn.trim() || !newDisplayName.trim()) return;

    setIsSubmitting(true);
    try {
      await mailboxAPI.addMailbox({
        upn: newUpn.trim().toLowerCase(),
        display_name: newDisplayName.trim(),
        status: "ACTIVE",
      });
      setNewUpn("");
      setNewDisplayName("");
      fetchMailboxes();
      fetchAuditLogs(currentPage);
    } catch (err) {
      alert("Failed to add mailbox. It may already exist in the database.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openConfirmation = (mailbox, action) => {
    setSelectedMailbox(mailbox);
    setTargetAction(action);
    setModalOpen(true);
  };

  const confirmAction = async () => {
    if (!selectedMailbox) return;

    try {
      await mailboxAPI.executeAction(selectedMailbox.id, targetAction);
      fetchMailboxes();
      fetchAuditLogs(currentPage);
    } catch (err) {
      alert("Failed to execute mailbox action.");
    } finally {
      setModalOpen(false);
      setSelectedMailbox(null);
    }
  };

  const activeCount = mailboxes.filter((m) => m.status === "ACTIVE").length;
  const blockedCount = mailboxes.filter((m) => m.status === "BLOCKED").length;
  const wipedCount = mailboxes.filter((m) => m.status === "WIPED").length;

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
            <Mail size={20} strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Active Mailboxes
            </p>
            <p className="text-3xl font-black text-slate-900 mt-1">
              {activeCount}{" "}
              <span className="text-sm font-bold text-slate-400">Users</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="w-10 h-10 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-4">
            <Lock size={20} strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Blocked Mailboxes
            </p>
            <p className="text-3xl font-black text-slate-900 mt-1">
              {blockedCount}{" "}
              <span className="text-sm font-bold text-slate-400">Users</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4">
            <ShieldAlert size={20} strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Wiped / Compromised
            </p>
            <p className="text-3xl font-black text-slate-900 mt-1">
              {wipedCount}{" "}
              <span className="text-sm font-bold text-slate-400">Users</span>
            </p>
          </div>
        </div>
      </div>

      {/* Grid Table & Add Mailbox Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <ShieldAlert size={16} className="text-slate-400" /> Organization
            Mailbox Inventory
          </h3>

          <form
            onSubmit={handleAddMailbox}
            className="flex flex-wrap md:flex-nowrap gap-2 w-full md:w-auto"
          >
            <input
              type="text"
              placeholder="Display Name (e.g. Test User)"
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-xl px-3 py-2 outline-none focus:border-slate-400 flex-1 md:w-44"
              required
            />
            <input
              type="email"
              placeholder="UPN (e.g. test@retail-org.com)"
              value={newUpn}
              onChange={(e) => setNewUpn(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-xl px-3 py-2 outline-none focus:border-slate-400 flex-1 md:w-56"
              required
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors flex items-center gap-1 shrink-0 disabled:opacity-50"
            >
              <Plus size={14} /> Add Mailbox
            </button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-6">User Principal Name (UPN)</th>
                <th className="py-3 px-6">Display Name</th>
                <th className="py-3 px-6">Current Status</th>
                <th className="py-3 px-6 text-right">Management Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {mailboxes.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="py-8 text-center text-slate-400 italic"
                  >
                    No mailboxes found in inventory.
                  </td>
                </tr>
              ) : (
                mailboxes.map((m) => (
                  <tr
                    key={m.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-4 px-6 font-bold text-slate-900">
                      {m.upn}
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      {m.display_name}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          m.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : m.status === "BLOCKED"
                              ? "bg-red-50 text-red-700 border border-red-100"
                              : "bg-amber-50 text-amber-700 border border-amber-100"
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      {m.status === "BLOCKED" ? (
                        <button
                          onClick={() => openConfirmation(m, "unblock")}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
                        >
                          Unblock
                        </button>
                      ) : (
                        <button
                          onClick={() => openConfirmation(m, "block")}
                          className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
                        >
                          Block
                        </button>
                      )}
                      <button
                        onClick={() => openConfirmation(m, "wipe")}
                        className="px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
                      >
                        Emergency Wipe
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Logs Tabular View with Target Mail Column */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <ShieldAlert size={16} className="text-slate-400" /> Compliance &
            Change Audit Trail (Mail Operations)
          </h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Showing latest entries (10 per page)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Activity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">Target Mail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loadingLogs ? (
                <tr>
                  <td
                    colSpan="5"
                    className="py-8 text-center text-slate-400 italic"
                  >
                    Loading mail audit entries...
                  </td>
                </tr>
              ) : auditLogs.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="py-8 text-center text-slate-400 italic"
                  >
                    No mail operations recorded yet.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {log.date} {log.time}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {log.playbook_display || log.playbook}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          log.status.toLowerCase() === "success"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : "bg-red-50 text-red-700 border border-red-100"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{log.user}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {extractTargetEmail(log)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

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
                Confirm Mailbox Action
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                You are about to{" "}
                <strong className="text-slate-800 uppercase">
                  {targetAction}
                </strong>{" "}
                the mailbox for{" "}
                <strong className="text-slate-800">
                  {selectedMailbox?.upn}
                </strong>
                .
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className="flex-1 py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg"
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

export default EmailControlManager;
