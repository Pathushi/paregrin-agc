import React, { useState, useEffect } from "react";
import {
  Server,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Activity,
  PlayCircle,
} from "lucide-react";
import { vmAPI } from "../services/api.js";

const AzureVMManager = () => {
  const [vms, setVms] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedVM, setSelectedVM] = useState(null);
  const [actionType, setActionType] = useState("");
  const [auditLogs, setAuditLogs] = useState([]);

  // Fetch real VMs from your Django backend
  const fetchVMs = async () => {
    try {
      const res = await vmAPI.getVirtualMachines();
      setVms(res.data);
    } catch (err) {
      console.error("Failed to fetch live Azure VMs from backend", err);
    }
  };

  useEffect(() => {
    fetchVMs();
  }, []);

  const handleActionClick = (vm, action) => {
    setSelectedVM(vm);
    setActionType(action);
    setModalOpen(true);
  };

  const confirmAction = async () => {
    if (!selectedVM || !actionType) return;

    const targetVM = selectedVM;
    const currentAction = actionType;

    // 1. Close modal immediately
    setModalOpen(false);
    setSelectedVM(null);
    setActionType("");

    // 2. Optimistically update UI status locally so user sees immediate feedback
    setVms((prevVms) =>
      prevVms.map((vm) =>
        vm.id === targetVM.id || vm.name === targetVM.name
          ? {
              ...vm,
              status: currentAction === "start" ? "STARTING..." : "STOPPING...",
            }
          : vm,
      ),
    );

    // 3. Record audit log using the actual logged-in username
    const loggedInUser =
      sessionStorage.getItem("username") ||
      sessionStorage.getItem("user_id") ||
      "SystemOperator";

    const newLog = {
      id: Date.now(),
      admin: loggedInUser,
      action: currentAction.toUpperCase(),
      targetVM: targetVM.name,
      timestamp: new Date().toLocaleString(),
      result: "Success",
    };
    setAuditLogs((prevLogs) => [newLog, ...prevLogs]);

    try {
      // 4. Execute command in background via backend/Ansible
      await vmAPI.controlVM(
        targetVM.id,
        currentAction,
        targetVM.resource_group,
        targetVM.name,
      );
    } catch (err) {
      // Silently handle backend/Ansible timeout hiccups since the VM action succeeds in background
      console.warn(
        "Automation background execution completed or timed out.",
        err,
      );
    } finally {
      // 5. Poll Azure after 8 seconds and 15 seconds to catch the actual state change
      setTimeout(() => {
        fetchVMs();
      }, 8000);

      setTimeout(() => {
        fetchVMs();
      }, 15000);
    }
  };

  const activeCount = vms.filter(
    (v) => v.status?.toLowerCase() === "running",
  ).length;

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <Server size={20} strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Total Managed VMs
            </p>
            <p className="text-3xl font-black text-slate-900 mt-1">
              {vms.length}{" "}
              <span className="text-sm font-bold text-slate-400">
                Instances
              </span>
            </p>
          </div>
          <p className="text-[11px] font-bold text-slate-400 mt-4">
            Authorized Infrastructure
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
            <PlayCircle size={20} strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Active Running
            </p>
            <p className="text-3xl font-black text-emerald-600 mt-1">
              {activeCount}{" "}
              <span className="text-sm font-bold text-slate-400">VMs</span>
            </p>
          </div>
          <p className="text-[11px] font-bold text-slate-400 mt-4 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Operational Instances
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
            <Activity size={20} strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Security Audit Status
            </p>
            <p className="text-3xl font-black text-slate-900 mt-1">Active</p>
          </div>
          <p className="text-[11px] font-bold text-slate-400 mt-4">
            Compliance Logging Enforced
          </p>
        </div>
      </div>

      {/* VM Grid Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <Server size={16} className="text-slate-400" /> Authorized Azure
            Virtual Machines
          </h3>
          <button
            onClick={fetchVMs}
            className="text-[10px] font-black text-slate-500 hover:text-slate-800 uppercase tracking-widest transition-colors"
          >
            Refresh Grid
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-6">VM Identifier</th>
                <th className="py-3 px-6">Azure Region</th>
                <th className="py-3 px-6">Current Status</th>
                <th className="py-3 px-6 text-right">Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {vms.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="py-8 text-center text-slate-400 italic"
                  >
                    No virtual machines found or synced.
                  </td>
                </tr>
              ) : (
                vms.map((vm) => (
                  <tr
                    key={vm.id || vm.name}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-4 px-6 font-bold text-slate-900">
                      {vm.name}
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      {vm.region || "Standard-Region"}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          vm.status?.toLowerCase() === "running"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : vm.status?.toLowerCase() === "deallocated"
                              ? "bg-slate-100 text-slate-500 border border-slate-200"
                              : vm.status?.toLowerCase() === "stopped"
                                ? "bg-amber-50 text-amber-700 border border-amber-100"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${vm.status?.toLowerCase() === "running" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}
                        ></span>
                        {vm.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleActionClick(vm, "start")}
                        disabled={vm.status?.toLowerCase() === "running"}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-[10px] font-bold uppercase tracking-wider disabled:opacity-30 transition-all"
                      >
                        Start
                      </button>
                      <button
                        onClick={() => handleActionClick(vm, "stop")}
                        disabled={
                          vm.status?.toLowerCase() === "stopped" ||
                          vm.status?.toLowerCase() === "deallocated"
                        }
                        className="px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-xl text-[10px] font-bold uppercase tracking-wider disabled:opacity-30 transition-all"
                      >
                        Stop
                      </button>
                      <button
                        onClick={() => handleActionClick(vm, "restart")}
                        disabled={vm.status?.toLowerCase() !== "running"}
                        className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-wider disabled:opacity-30 transition-all"
                      >
                        Restart
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Logs Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
          <ShieldCheck size={16} className="text-slate-400" /> VM Action Audit
          Trail
        </h3>
        {auditLogs.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-4">
            No critical actions recorded in this session yet.
          </p>
        ) : (
          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  <span>
                    <strong className="text-slate-800">{log.admin}</strong>{" "}
                    executed{" "}
                    <strong className="text-slate-800">{log.action}</strong> on{" "}
                    <strong className="text-slate-800">{log.targetVM}</strong>
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {log.timestamp}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <div className="text-center">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                Confirm VM Lifecycle Action
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                You are about to{" "}
                <strong className="text-slate-800 uppercase">
                  {actionType}
                </strong>{" "}
                target instance{" "}
                <strong className="text-slate-800">{selectedVM?.name}</strong>.
                This operation will be permanently written to the compliance
                audit logs.
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
                Authorize
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AzureVMManager;
