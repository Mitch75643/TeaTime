import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { getDeviceFingerprint } from '@/lib/fingerprint';

interface AdminUser {
  email: string;
  fingerprint: string;
  role: string;
  sessionId: string;
}

interface AdminAuthStatus {
  authenticated: boolean;
  admin?: AdminUser;
}

export function useAdminAuth() {
  const queryClient = useQueryClient();

  // Check current admin session
  const { data: authStatus, isLoading } = useQuery<AdminAuthStatus>({
    queryKey: ['/api/admin/session'],
    retry: false,
  });

  // Verify fingerprint step
  const verifyFingerprintMutation = useMutation({
    mutationFn: async (fingerprint: string) => {
      return apiRequest('POST', '/api/admin/verify-fingerprint', { fingerprint });
    },
  });

  // Complete admin login
  const loginMutation = useMutation({
    mutationFn: async ({ fingerprint, email }: { fingerprint: string; email: string }) => {
      return apiRequest('POST', '/api/admin/login', { fingerprint, email });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/session'] });
    },
  });

  // Admin logout
  const logoutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/admin/logout');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/session'] });
    },
  });

  return {
    isAuthenticated: authStatus?.authenticated || false,
    admin: authStatus?.admin,
    isLoading,
    verifyFingerprint: verifyFingerprintMutation.mutateAsync,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isVerifyingFingerprint: verifyFingerprintMutation.isPending,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isRootHost: authStatus?.admin?.role === 'root_host',
  };
}

// Hook for admin management (root host only)
export function useAdminManagement() {
  const queryClient = useQueryClient();

  // Get admin list
  const { data: adminList, isLoading: isLoadingAdmins } = useQuery({
    queryKey: ['/api/admin/manage/list'],
    retry: false,
  });

  // Add admin
  const addAdminMutation = useMutation({
    mutationFn: async (adminData: {
      fingerprint: string;
      fingerprintLabel: string;
      email: string;
      role: 'admin' | 'root_host';
      password: string;
    }) => {
      return apiRequest('POST', '/api/admin/manage/add', adminData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/manage/list'] });
    },
  });

  // Remove admin
  const removeAdminMutation = useMutation({
    mutationFn: async (targetEmail: string, password: string) => {
      return apiRequest('POST', '/api/admin/manage/remove', { targetEmail, password });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/manage/list'] });
    },
  });

  return {
    adminList: adminList || [],
    isLoadingAdmins,
    addAdmin: addAdminMutation.mutateAsync,
    removeAdmin: removeAdminMutation.mutateAsync,
    isAddingAdmin: addAdminMutation.isPending,
    isRemovingAdmin: removeAdminMutation.isPending,
  };
}