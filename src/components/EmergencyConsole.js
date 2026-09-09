import React, { useState } from "react";
import { emergencyAPI } from "../services/api";

const EmergencyConsole = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [mfaPin, setMfaPin] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleExecutePanic = async () => {
    if (confirmationText !== "ACTIVATE PANIC" || !mfaPin) {
      setError(
        "You must enter the exact confirmation phrase and your MFA PIN.",
      );
      return;
    }

    setIsExecuting(true);
    setError(null);
    setResults(null);

    try {
      // Uses the centralized Axios instance from api.js
      const response = await emergencyAPI.executePanic(
        confirmationText,
        mfaPin,
      );
      setResults(response.data.details);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Failed to communicate with emergency controller.",
      );
    } finally {
      setIsExecuting(false);
      setIsUnlocked(false);
      setConfirmationText("");
      setMfaPin("");
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white rounded-lg shadow border-t-4 border-red-600">
      <h2 className="text-2xl font-bold text-red-700 mb-4 flex items-center">
        <span className="material-icons mr-2">warning</span>
        EMERGENCY PANIC PROTOCOL
      </h2>

      <p className="text-gray-600 mb-6">
        Activating this protocol will instantly terminate Azure VMs, sever
        external email domain connections, and revoke Azure Storage access in
        parallel. <b>This action causes immediate infrastructure downtime.</b>
      </p>

      {!isUnlocked && !isExecuting && !results && (
        <button
          onClick={() => setIsUnlocked(true)}
          className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 px-6 rounded w-full transition-colors"
        >
          UNLOCK EMERGENCY CONTROLS
        </button>
      )}

      {isUnlocked && (
        <div className="bg-red-50 p-4 rounded border border-red-200 mb-6">
          <label className="block text-sm font-bold text-red-800 mb-2">
            Type "ACTIVATE PANIC" to confirm:
          </label>
          <input
            type="text"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            className="w-full p-2 border border-red-300 rounded mb-4"
            placeholder="ACTIVATE PANIC"
          />

          <label className="block text-sm font-bold text-red-800 mb-2">
            Admin Password / MFA PIN:
          </label>
          <input
            type="password"
            value={mfaPin}
            onChange={(e) => setMfaPin(e.target.value)}
            className="w-full p-2 border border-red-300 rounded mb-4"
            placeholder="Enter credentials to authorize"
          />

          {error && <p className="text-red-600 font-bold mb-4">{error}</p>}

          <div className="flex gap-4">
            <button
              onClick={handleExecutePanic}
              className="bg-red-600 hover:bg-red-800 animate-pulse text-white font-bold py-3 px-6 rounded w-full"
            >
              EXECUTE INFRASTRUCTURE SHUTDOWN
            </button>
            <button
              onClick={() => setIsUnlocked(false)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded w-1/3"
            >
              CANCEL
            </button>
          </div>
        </div>
      )}

      {isExecuting && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <h3 className="text-xl font-bold text-red-600 animate-pulse">
            EXECUTING PARALLEL SHUTDOWN PROTOCOLS...
          </h3>
          <p className="text-gray-500 mt-2">
            Running Ansible controllers for VMs, Storage, and Mailbox routing.
          </p>
        </div>
      )}

      {results && (
        <div className="mt-6 border-t pt-4">
          <h3 className="font-bold text-lg mb-4">Execution Status Report</h3>
          <div className="space-y-3">
            {results.map((res, idx) => (
              <div
                key={idx}
                className={`p-4 rounded border flex justify-between items-center ${res.status === "success" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
              >
                <div>
                  <h4 className="font-bold">{res.action}</h4>
                  <span className="text-sm text-gray-600">
                    {res.status === "success"
                      ? "Secured"
                      : res.error || "Execution Failed"}
                  </span>
                </div>
                <div>
                  {res.status === "success" ? (
                    <span className="bg-green-600 text-white px-3 py-1 rounded text-sm font-bold">
                      SUCCESS
                    </span>
                  ) : (
                    <button
                      onClick={() =>
                        alert(`Retry logic for ${res.action} triggered.`)
                      }
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm font-bold hover:bg-red-700"
                    >
                      RETRY FAILED ACTION
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyConsole;
