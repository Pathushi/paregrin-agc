import axios from "axios";

// Points to your active AWS backend with absolute URL for local development
const BASE_URL = "http://13.48.84.7/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// AUTO-ATTACH TOKEN
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the server returns 401 Unauthorized, the session has expired
    if (error.response && error.response.status === 401) {
      sessionStorage.clear();
      alert("System has timed out. Please log in again.");
      window.location.href = "/";
    }
    return Promise.reject(error);
  },
);

// ============================================================
// TASK ENDPOINTS
// ============================================================
const taskEndpoints = {
  getUserHistory: (userId) => api.get(`/tasks/user-history/?user_id=${userId}`),
  getAssignedTasks: (userId) =>
    api.get(`/tasks/assignments/?user_id=${userId}`),
  assignTask: (data) => api.post("/tasks/assignments/", data),
};

// ============================================================
// AUTH API
// ============================================================
export const authAPI = {
  getCaptcha: () => api.get("/auth/captcha/"),
  loginStepOne: (credentials) => api.post("/auth/agc-login/", credentials),
  verifyPin: (userId, pin) =>
    api.post("/auth/agc-verify-pin/", { user_id: userId, pin }),
  forgotPassword: (data) => api.post("/auth/forgot-password/", data),
};

// ============================================================
// USER PROFILE API
// ============================================================
export const userProfileAPI = {
  getMyProfile: (userId) => api.get(`/users/me/?user_id=${userId}`),
  updateMyProfile: (userId, formData) =>
    api.put(`/users/me/?user_id=${userId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

// ============================================================
// ADMIN API
// ============================================================
export const adminAPI = {
  getSystemStats: () => api.get("/auth/stats/"),
  getUsers: () => api.get("/users/"),
  createUser: (data) => api.post("/users/", data),
  deleteUser: (id) => api.delete(`/users/${id}/`),
  updateUser: (id, data) => api.put(`/users/${id}/`, data),
  toggleUserAccess: (id) => api.post(`/users/${id}/toggle_access/`),
  getAGCUsers: () => api.get("/agc-users/"),
  createAGCUser: (data) => api.post("/agc-users/", data),
  updateAGCUser: (id, data) => api.put(`/agc-users/${id}/`, data),
  deleteAGCUser: (id) => api.delete(`/agc-users/${id}/`),
  toggleAGCUserAccess: (id) => api.post(`/agc-users/${id}/toggle_access/`),
  getGroups: () => api.get("/groups/"),
  createGroup: (data) => api.post("/groups/", data),
  updateGroup: (id, data) => api.put(`/groups/${id}/`, data),
  deleteGroup: (id) => api.delete(`/groups/${id}/`),
  assignPlaybookToGroup: (groupId, data) =>
    api.post(`/groups/${groupId}/assign_playbook/`, data),
  assignTask: (data) => api.post("/tasks/assignments/", data),
  getScheduledTasks: () => api.get("/tasks/assignments/"),
  ...taskEndpoints,
  getControllers: () => api.get("/controllers/"),
  addController: (data) => api.post("/controllers/", data),
  updateController: (id, data) => api.put(`/controllers/${id}/`, data),
  deleteController: (id) => api.delete(`/controllers/${id}/`),
  syncPlaybooks: (id) => api.get(`/controllers/${id}/sync_playbooks/`),
  pullPlaybooks: (id) => api.post(`/controllers/${id}/pull_playbooks/`),
  getCachedPlaybooks: (id) => api.get(`/playbook-cache/?controller_id=${id}`),
  getPlaybookDetails: (id, name) =>
    api.get(`/controllers/${id}/playbook-details/?name=${name}`),
  updatePlaybook: (id, name, data) =>
    api.put(`/controllers/${id}/playbook-details/?name=${name}`, data),
  deletePlaybook: (id, name) =>
    api.delete(`/controllers/${id}/playbook-details/?name=${name}`),
  getEscalationGroups: () => api.get("/escalation-groups/"),
  createEscalationGroup: (data) => api.post("/escalation-groups/", data),
  updateEscalationGroup: (id, data) =>
    api.put(`/escalation-groups/${id}/`, data),
  deleteEscalationGroup: (id) => api.delete(`/escalation-groups/${id}/`),
  addEscalationContact: (data) => api.post("/escalation-contacts/", data),
  deleteEscalationContact: (id) => api.delete(`/escalation-contacts/${id}/`),
  updateEscalationContact: (id, data) =>
    api.put(`/escalation-contacts/${id}/`, data),
  getNotificationChannels: () => api.get("/notifications/channels/"),
  getAllPlaybooks: () => api.get("/playbook-cache/"),
  exportReport: (format, status, date) =>
    api.get(`/task-reports/export/`, {
      params: { format, status, date },
      responseType: "blob",
    }),
};

// ============================================================
// USER API
// ============================================================
export const userAPI = {
  ...taskEndpoints,
  getMyTasks: (userId) => api.get(`/user/my-tasks/?user_id=${userId}`),
  runTask: (assignmentId, data) => {
    const userId = sessionStorage.getItem("user_id");
    return api.post(`/user/run-task/`, {
      assignment_id: assignmentId,
      user_id: userId,
      ...data,
    });
  },
  getScheduledTasks: (userId) => api.get(`/schedules/?user_id=${userId}`),
  scheduleTask: (data) => api.post(`/schedules/`, data),
  updateScheduledTask: (id, data) => api.put(`/schedules/${id}/`, data),
  deleteScheduledTask: (id) => api.delete(`/schedules/${id}/`),
};

// ============================================================
// AZURE VM MANAGEMENT API
// ============================================================
export const vmAPI = {
  getVirtualMachines: () => api.get("/azure-vms/"),
  controlVM: (vmId, action, resourceGroup, vmName) =>
    api.post(`/azure-vms/vm-action/`, {
      action: action,
      resource_group: resourceGroup,
      vm_name: vmName,
    }),
  getAuditLogs: () => api.get("/audit-logs/"),
};

export const mailboxAPI = {
  getMailboxes: () => api.get("/mailboxes/"),
  addMailbox: (data) => api.post("/mailboxes/", data),
  executeAction: (id, actionType) =>
    api.post(`/mailboxes/${id}/execute-action/`, { action_type: actionType }),
};

export const storageAPI = {
  getStorageAccounts: () => api.get("/storage-accounts/"),
  addStorageAccount: (data) => api.post("/storage-accounts/", data),
  executeAction: (id, actionType) =>
    api.post(`/storage-accounts/${id}/execute-action/`, {
      action_type: actionType,
    }),
};

export const emergencyAPI = {
  executePanic: (confirmationText, mfaPin) =>
    api.post("/emergency/panic/", {
      confirmation_text: confirmationText,
      mfa_pin: mfaPin,
    }),
};

export const scalefusionAPI = {
  getDevices: () => api.get("/mdm-devices/"),
  executeAction: (deviceId, actionType) =>
    api.post(`/mdm-devices/execute-action/`, {
      device_id: deviceId,
      action_type: actionType,
    }),
};

export default api;
