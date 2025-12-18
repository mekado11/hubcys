import React from 'react';
import { Lock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Permission mapping based on app_role
const ROLE_PERMISSIONS = {
  admin: ['*'], // All permissions
  security_manager: [
    'view:*',
    'edit:incidents',
    'edit:action_items',
    'edit:assessments',
    'edit:policies',
    'manage:users',
    'view:reports'
  ],
  security_analyst: [
    'view:*',
    'edit:incidents',
    'edit:action_items',
    'view:assessments',
    'view:policies',
    'view:reports'
  ],
  executive: [
    'view:dashboard',
    'view:reports',
    'view:assessments',
    'view:incidents',
    'view:action_items'
  ],
  auditor: [
    'view:*',
    'view:reports',
    'view:evidence',
    'view:compliance'
  ],
  member: [
    'view:dashboard',
    'view:assessments',
    'edit:action_items', // Can edit their own assigned items
    'view:incidents'
  ]
};

export function hasPermission(user, requiredPermission) {
  if (!user) return false;
  
  // Admins have all permissions
  if (user.company_role === 'admin' || user.app_role === 'admin') {
    return true;
  }
  
  // Check custom permissions first
  if (user.custom_permissions && Array.isArray(user.custom_permissions)) {
    if (user.custom_permissions.includes(requiredPermission)) return true;
    if (user.custom_permissions.includes('*')) return true;
  }
  
  // Check role-based permissions
  const rolePerms = ROLE_PERMISSIONS[user.app_role || 'member'] || ROLE_PERMISSIONS.member;
  
  if (rolePerms.includes('*')) return true;
  if (rolePerms.includes(requiredPermission)) return true;
  
  // Check wildcard permissions (e.g., 'view:*' matches 'view:incidents')
  const [action, resource] = requiredPermission.split(':');
  if (rolePerms.includes(`${action}:*`)) return true;
  
  return false;
}

export function canEditEntity(user, entityType, entity) {
  if (!user) return false;
  
  // Admins and security managers can edit everything
  if (user.company_role === 'admin' || user.app_role === 'admin' || user.app_role === 'security_manager') {
    return true;
  }
  
  // Check specific edit permission
  if (hasPermission(user, `edit:${entityType}`)) {
    return true;
  }
  
  // For action items, users can edit their own assigned items
  if (entityType === 'action_items' && entity && entity.assigned_to === user.email) {
    return true;
  }
  
  // For incidents, check if user is the assigned incident commander
  if (entityType === 'incidents' && entity && entity.assigned_to === user.email) {
    return true;
  }
  
  return false;
}

export default function RoleGate({ 
  children, 
  permission, 
  user, 
  fallback = null,
  showMessage = false 
}) {
  if (!user) {
    if (showMessage) {
      return (
        <Alert className="bg-red-900/20 border-red-500/30">
          <Lock className="w-4 h-4 text-red-400" />
          <AlertDescription className="text-red-200">
            You must be logged in to access this content.
          </AlertDescription>
        </Alert>
      );
    }
    return fallback;
  }
  
  if (!hasPermission(user, permission)) {
    if (showMessage) {
      return (
        <Alert className="bg-red-900/20 border-red-500/30">
          <Lock className="w-4 h-4 text-red-400" />
          <AlertDescription className="text-red-200">
            You don't have permission to access this content. Required permission: <code className="text-xs bg-red-500/20 px-1 py-0.5 rounded">{permission}</code>
          </AlertDescription>
        </Alert>
      );
    }
    return fallback;
  }
  
  return <>{children}</>;
}