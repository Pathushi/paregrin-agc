import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Server,
  Mail,
  HardDrive,
  AlertOctagon,
  LogOut,
  Feather,
} from "lucide-react";
import AzureVMManager from "../components/AzureVMManager";
import EmailControlManager from "../components/EmailControlManager";
import StorageControlManager from "../components/StorageControlManager";
import EmergencyConsole from "../components/EmergencyConsole";

const AGCDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("vms");

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex font-sans">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm">
        {/* Brand Header */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
          <Feather
            className="text-slate-400 fill-slate-200"
            size={24}
            strokeWidth={1.5}
          />
          <div>
            <h2 className="text-xs font-bold text-[#1e293b] tracking-[0.2em] uppercase">
              AGC Automation
            </h2>
            <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">
              Management Portal
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-1.5 mt-2">
          <button
            onClick={() => setActiveTab("vms")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === "vms" ? "bg-slate-100 text-slate-900 shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}
          >
            <Server size={16} strokeWidth={1.5} /> Azure VMs Grid
          </button>

          <button
            onClick={() => setActiveTab("email")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === "email" ? "bg-slate-100 text-slate-900 shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}
          >
            <Mail size={16} strokeWidth={1.5} /> Email Control
          </button>

          <button
            onClick={() => setActiveTab("storage")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === "storage" ? "bg-slate-100 text-slate-900 shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}
          >
            <HardDrive size={16} strokeWidth={1.5} /> Storage Volumes
          </button>
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 space-y-2">
          <button
            onClick={() => setActiveTab("emergency")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === "emergency" ? "bg-red-50 text-red-600 border border-red-100" : "text-red-500 hover:bg-red-50 hover:text-red-600"}`}
          >
            <AlertOctagon size={16} strokeWidth={1.5} /> Emergency Console
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all"
          >
            <LogOut size={16} strokeWidth={1.5} /> Terminate Session
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center px-8 justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-3 text-slate-800">
            <LayoutDashboard
              size={18}
              className="text-slate-400"
              strokeWidth={1.5}
            />
            <h1 className="text-xs font-bold uppercase tracking-[0.15em]">
              {activeTab === "vms" && "Virtual Machine Management Grid"}
              {activeTab === "email" && "Domain & Mailbox Routing Control"}
              {activeTab === "storage" && "Azure Cloud Storage Allocations"}
              {activeTab === "emergency" && "Emergency System Override Console"}
            </h1>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
              MFA Clearance Active
            </span>
          </div>
        </header>

        {/* Dynamic View Panels */}
        <main className="flex-1 overflow-auto p-8 bg-[#f8f9fc]">
          {activeTab === "vms" && <AzureVMManager />}

          {activeTab === "email" && <EmailControlManager />}

          {activeTab === "storage" && <StorageControlManager />}

          {activeTab === "emergency" && <EmergencyConsole />}
        </main>
      </div>
    </div>
  );
};

export default AGCDashboard;
