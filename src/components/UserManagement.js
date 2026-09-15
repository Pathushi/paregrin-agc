import React, { useState, useEffect } from "react";
import { adminAPI } from "../services/api";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    first_name: "",
    last_name: "",
    designation: "",
    mobile: "",
    pin: "123456",
    is_staff: false, // Added is_staff field
  });
  const [error, setError] = useState(null);

  const loadUsers = async () => {
    try {
      const response = await adminAPI.getAGCUsers();
      setUsers(response.data.results || response.data);
    } catch (err) {
      console.error("Failed to load AGC users", err);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setCurrentUserId(null);
    setFormData({
      username: "",
      password: "",
      first_name: "",
      last_name: "",
      designation: "",
      mobile: "",
      pin: "123456",
      is_staff: false, // Default to subordinate user
    });
    setError(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (user) => {
    setIsEditing(true);
    setCurrentUserId(user.id);
    setFormData({
      username: user.username,
      password: "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      designation: user.designation || "",
      mobile: user.mobile || "",
      pin: user.pin || "123456",
      is_staff: user.is_staff || false, // Load existing permissions
    });
    setError(null);
    setShowModal(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await adminAPI.updateAGCUser(currentUserId, formData);
      } else {
        await adminAPI.createAGCUser(formData);
      }
      setShowModal(false);
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save user");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await adminAPI.deleteAGCUser(id);
        loadUsers();
      } catch (err) {
        console.error("Failed to delete user", err);
      }
    }
  };

  const handleToggle = async (id) => {
    await adminAPI.toggleAGCUserAccess(id);
    loadUsers();
  };

  return React.createElement(
    "div",
    { className: "p-6" },
    React.createElement(
      "div",
      { className: "flex justify-between items-center mb-6" },
      React.createElement(
        "h2",
        { className: "text-xl font-bold text-gray-800" },
        "User Account Management",
      ),
      React.createElement(
        "button",
        {
          onClick: handleOpenCreateModal,
          className:
            "bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold",
        },
        "+ Create New User",
      ),
    ),

    React.createElement(
      "div",
      {
        className:
          "bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden",
      },
      React.createElement(
        "table",
        { className: "w-full text-left border-collapse" },
        React.createElement(
          "thead",
          null,
          React.createElement(
            "tr",
            {
              className:
                "bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase",
            },
            React.createElement("th", { className: "p-4" }, "Username"),
            React.createElement("th", { className: "p-4" }, "Full Name"),
            React.createElement("th", { className: "p-4" }, "Role"), // Added Role Header
            React.createElement("th", { className: "p-4" }, "Status"),
            React.createElement(
              "th",
              { className: "p-4 text-right" },
              "Actions",
            ),
          ),
        ),
        React.createElement(
          "tbody",
          { className: "divide-y divide-gray-100 text-sm" },
          users.map((user) =>
            React.createElement(
              "tr",
              { key: user.id, className: "hover:bg-gray-50" },
              React.createElement(
                "td",
                { className: "p-4 font-medium text-gray-900" },
                user.username,
              ),
              React.createElement(
                "td",
                { className: "p-4 text-gray-600" },
                `${user.first_name || ""} ${user.last_name || ""}`,
              ),
              React.createElement(
                // Added Role Display
                "td",
                { className: "p-4" },
                React.createElement(
                  "span",
                  {
                    className: `px-2.5 py-1 rounded-full text-xs font-semibold ${user.is_staff ? "bg-purple-50 text-purple-600" : "bg-gray-100 text-gray-600"}`,
                  },
                  user.is_staff ? "Admin" : "Standard User",
                ),
              ),
              React.createElement(
                "td",
                { className: "p-4" },
                React.createElement(
                  "span",
                  {
                    className: `px-2.5 py-1 rounded-full text-xs font-semibold ${user.is_enabled ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`,
                  },
                  user.is_enabled ? "Active" : "Disabled",
                ),
              ),
              React.createElement(
                "td",
                { className: "p-4 text-right space-x-2" },
                React.createElement(
                  "button",
                  {
                    onClick: () => handleToggle(user.id),
                    className: `px-2.5 py-1 rounded text-xs font-medium ${user.is_enabled ? "bg-amber-50 text-amber-600 hover:bg-amber-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"}`,
                  },
                  user.is_enabled ? "Disable" : "Enable",
                ),
                React.createElement(
                  "button",
                  {
                    onClick: () => handleOpenEditModal(user),
                    className:
                      "px-2.5 py-1 rounded text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100",
                  },
                  "Edit",
                ),
                React.createElement(
                  "button",
                  {
                    onClick: () => handleDelete(user.id),
                    className:
                      "px-2.5 py-1 rounded text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100",
                  },
                  "Delete",
                ),
              ),
            ),
          ),
        ),
      ),
    ),

    showModal &&
      React.createElement(
        "div",
        {
          className:
            "fixed inset-0 bg-black/50 flex items-center justify-center z-50",
        },
        React.createElement(
          "div",
          { className: "bg-white p-6 rounded-2xl w-full max-w-md shadow-xl" },
          React.createElement(
            "h3",
            { className: "text-lg font-bold mb-4" },
            isEditing ? "Modify User Account" : "Create New User",
          ),
          error &&
            React.createElement(
              "p",
              { className: "text-red-500 text-xs mb-3" },
              error,
            ),
          React.createElement(
            "form",
            { onSubmit: handleSaveUser, className: "space-y-3" },
            React.createElement("input", {
              type: "text",
              placeholder: "Username",
              value: formData.username,
              onChange: (e) =>
                setFormData({ ...formData, username: e.target.value }),
              className: "w-full p-2 border rounded text-sm",
              required: true,
            }),
            React.createElement("input", {
              type: "password",
              placeholder: isEditing ? "New Password (optional)" : "Password",
              value: formData.password,
              onChange: (e) =>
                setFormData({ ...formData, password: e.target.value }),
              className: "w-full p-2 border rounded text-sm",
              required: !isEditing,
            }),
            React.createElement("input", {
              type: "text",
              maxLength: "6",
              placeholder: "6-Digit Clearance PIN",
              value: formData.pin,
              onChange: (e) =>
                setFormData({ ...formData, pin: e.target.value }),
              className: "w-full p-2 border rounded text-sm",
              required: true,
            }),
            React.createElement(
              "div",
              { className: "grid grid-cols-2 gap-2" },
              React.createElement("input", {
                type: "text",
                placeholder: "First Name",
                value: formData.first_name,
                onChange: (e) =>
                  setFormData({ ...formData, first_name: e.target.value }),
                className: "w-full p-2 border rounded text-sm",
              }),
              React.createElement("input", {
                type: "text",
                placeholder: "Last Name",
                value: formData.last_name,
                onChange: (e) =>
                  setFormData({ ...formData, last_name: e.target.value }),
                className: "w-full p-2 border rounded text-sm",
              }),
            ),
            React.createElement("input", {
              type: "text",
              placeholder: "Designation",
              value: formData.designation,
              onChange: (e) =>
                setFormData({ ...formData, designation: e.target.value }),
              className: "w-full p-2 border rounded text-sm",
            }),
            React.createElement("input", {
              type: "text",
              placeholder: "Mobile",
              value: formData.mobile,
              onChange: (e) =>
                setFormData({ ...formData, mobile: e.target.value }),
              className: "w-full p-2 border rounded text-sm",
            }),

            // --- NEW: Admin Privileges Checkbox ---
            React.createElement(
              "div",
              { className: "flex items-center space-x-2 mt-2 py-2 border-t" },
              React.createElement("input", {
                type: "checkbox",
                checked: formData.is_staff,
                onChange: (e) =>
                  setFormData({ ...formData, is_staff: e.target.checked }),
                className:
                  "w-4 h-4 text-slate-800 rounded focus:ring-slate-800 cursor-pointer",
              }),
              React.createElement(
                "label",
                {
                  className:
                    "text-sm font-semibold text-gray-700 cursor-pointer",
                  onClick: () =>
                    setFormData({ ...formData, is_staff: !formData.is_staff }),
                },
                "Grant Admin Privileges (Allows User Management)",
              ),
            ),
            // ---------------------------------------

            React.createElement(
              "div",
              { className: "flex justify-end space-x-2 mt-4" },
              React.createElement(
                "button",
                {
                  type: "button",
                  onClick: () => setShowModal(false),
                  className:
                    "px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded",
                },
                "Cancel",
              ),
              React.createElement(
                "button",
                {
                  type: "submit",
                  className:
                    "px-4 py-2 text-sm bg-slate-800 text-white rounded hover:bg-slate-900",
                },
                isEditing ? "Update Changes" : "Save User",
              ),
            ),
          ),
        ),
      ),
  );
};

export default UserManagement;
