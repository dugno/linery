"use client";

import { createContext, useContext, useState } from "react";

type AdminPermissionContextValue = {
  permissions: string[];
  role?: string;
  setShowAdvancedJsonEditor?: (value: boolean) => void;
  showAdvancedJsonEditor?: boolean;
};

const AdminPermissionContext = createContext<AdminPermissionContextValue>({
  permissions: [],
  showAdvancedJsonEditor: true,
});

export function AdminPermissionProvider({ children, permissions, role, showAdvancedJsonEditor = true }: AdminPermissionContextValue & { children: React.ReactNode }) {
  const [currentShowAdvancedJsonEditor, setCurrentShowAdvancedJsonEditor] = useState(showAdvancedJsonEditor);

  return (
    <AdminPermissionContext.Provider
      value={{
        permissions,
        role,
        setShowAdvancedJsonEditor: setCurrentShowAdvancedJsonEditor,
        showAdvancedJsonEditor: currentShowAdvancedJsonEditor,
      }}
    >
      {children}
    </AdminPermissionContext.Provider>
  );
}

export function useAdminPermissions() {
  return useContext(AdminPermissionContext);
}

export function hasAdminPermission(permissions: readonly string[], permission: string) {
  return permissions.includes(permission);
}
