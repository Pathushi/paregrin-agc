import React, { useState, useEffect } from "react";
import {
  Smartphone,
  Laptop,
  Power,
  RotateCw,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";
import { scalefusionAPI } from "../services/api";

const ScalefusionManager = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [targetAction, setTargetAction] = useState("");

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const res = await scalefusionAPI.getDevices();
      setDevices(res.data);
    } catch (err) {
      console.error("Failed to fetch Scalefusion devices", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const openConfirmation = (device, action) => {
    setSelectedDevice(device);
    setTargetAction(action);
    setModalOpen(true);
  };

  const confirmAction = async () => {
    if (!selectedDevice || !targetAction) return;

    try {
      await scalefusionAPI.executeAction(selectedDevice.id, targetAction);
      setTimeout(fetchDevices, 1500);
    } catch (err) {
      alert(`Failed to execute ${targetAction.replace("_", " ")} on device.`);
    } finally {
      setModalOpen(false);
      setSelectedDevice(null);
      setTargetAction("");
    }
  };

  const filteredDevices = devices.filter((d) =>
    filter === "all" ? true : d.type === filter,
  );
  const laptopCount = devices.filter((d) => d.type === "laptop").length;
  const mobileCount = devices.filter((d) => d.type === "mobile").length;

  if (loading)
    return (
      <div className="p-6 text-center text-slate-500 animate-pulse">
        Synchronizing MDM endpoint inventory from Scalefusion...
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          onClick={() => setFilter("all")}
          className={`cursor-pointer bg-white p-6 rounded-3xl border shadow-sm transition-all ${filter === "all" ? "border-indigo-500 ring-1 ring-indigo-500" : "border-slate-100"}`}
        >
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Total Endpoints
          </p>
          <p className="text-3xl font-black text-slate-900 mt-1">
            {devices.length}
          </p>
        </div>
        <div
          onClick={() => setFilter("laptop")}
          className={`cursor-pointer bg-white p-6 rounded-3xl border shadow-sm transition-all ${filter === "laptop" ? "border-blue-500 ring-1 ring-blue-500" : "border-slate-100"}`}
        >
          <div className="flex items-center gap-3 mb-2">
            <Laptop size={16} className="text-blue-600" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Laptops
          </p>
          <p className="text-3xl font-black text-slate-900 mt-1">
            {laptopCount}
          </p>
        </div>
        <div
          onClick={() => setFilter("mobile")}
          className={`cursor-pointer bg-white p-6 rounded-3xl border shadow-sm transition-all ${filter === "mobile" ? "border-emerald-500 ring-1 ring-emerald-500" : "border-slate-100"}`}
        >
          <div className="flex items-center gap-3 mb-2">
            <Smartphone size={16} className="text-emerald-600" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Mobile Phones
          </p>
          <p className="text-3xl font-black text-slate-900 mt-1">
            {mobileCount}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <ShieldAlert size={16} className="text-slate-400" /> Scalefusion
            Device Inventory
          </h3>
          <button
            onClick={fetchDevices}
            className="text-[10px] font-black text-slate-500 hover:text-slate-800 uppercase tracking-widest"
          >
            Refresh Sync
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-6">Device Name</th>
                <th className="py-3 px-6">OS</th>
                <th className="py-3 px-6">Battery</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {filteredDevices.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="py-8 text-center text-slate-400 italic"
                  >
                    No devices found.
                  </td>
                </tr>
              ) : (
                filteredDevices.map((dev, index) => (
                  <tr key={dev.id || index} className="hover:bg-slate-50/50">
                    <td className="py-4 px-6 font-bold text-slate-900 flex items-center gap-3">
                      {dev.type === "laptop" ? (
                        <Laptop size={16} className="text-slate-400" />
                      ) : (
                        <Smartphone size={16} className="text-slate-400" />
                      )}{" "}
                      {dev.name}
                    </td>
                    <td className="py-4 px-6 text-slate-500">{dev.os}</td>
                    <td className="py-4 px-6">
                      <span
                        className={
                          dev.battery < 20
                            ? "text-red-500 font-bold"
                            : "text-slate-500"
                        }
                      >
                        {dev.battery}%
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700">
                        Active
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => openConfirmation(dev, "reboot")}
                        className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-wider"
                      >
                        Reboot
                      </button>
                      <button
                        onClick={() => openConfirmation(dev, "shutdown")}
                        className="px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-xl text-[10px] font-bold uppercase tracking-wider"
                      >
                        Shutdown
                      </button>

                      {dev.type === "mobile" ? (
                        <button
                          onClick={() => openConfirmation(dev, "factory_reset")}
                          className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl text-[10px] font-bold uppercase tracking-wider"
                        >
                          Factory Reset
                        </button>
                      ) : (
                        <button
                          onClick={() => openConfirmation(dev, "wipe")}
                          className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl text-[10px] font-bold uppercase tracking-wider"
                        >
                          Wipe
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${targetAction === "wipe" || targetAction === "factory_reset" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}`}
            >
              {targetAction === "reboot" ? (
                <RotateCw size={24} />
              ) : targetAction === "shutdown" ? (
                <Power size={24} />
              ) : (
                <AlertTriangle size={24} />
              )}
            </div>
            <div className="text-center">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                Confirm Remote {targetAction.replace("_", " ")}
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                You are pushing a{" "}
                <strong className="text-slate-800 uppercase">
                  {targetAction.replace("_", " ")}
                </strong>{" "}
                command to{" "}
                <strong className="text-slate-800">
                  {selectedDevice?.name}
                </strong>
                .
                {(targetAction === "wipe" ||
                  targetAction === "factory_reset") &&
                  " WARNING: This will irreversibly erase all data."}
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
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase shadow-lg ${targetAction === "wipe" || targetAction === "factory_reset" ? "bg-red-600 text-white" : "bg-slate-900 text-white"}`}
              >
                Execute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScalefusionManager;
