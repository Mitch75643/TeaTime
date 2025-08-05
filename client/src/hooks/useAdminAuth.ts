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
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't keep in cache
    refetchOnMount: true,
    refetchOnWindowFocus: true,
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
    onSuccess: (data) => {
      console.log('Admin add success, invalidating cache:', data);
      // Multiple cache invalidation strategies to force refresh
      queryClient.removeQueries({ queryKey: ['/api/admin/manage/list'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/manage/list'] });
      queryClient.refetchQueries({ queryKey: ['/api/admin/manage/list'] });
      
      // Force reload with cache busting
      setTimeout(() => {
        queryClient.removeQueries({ queryKey: ['/api/admin/manage/list'] });
        queryClient.refetchQueries({ queryKey: ['/api/admin/manage/list'] });
      }, 100);
    },
  });

  // Remove admin
  const removeAdminMutation = useMutation({
    mutationFn: async ({ targetEmail, password }: { targetEmail: string; password: string }) => {
      return apiRequest('POST', '/api/admin/manage/remove', { targetEmail, password });
    },
    onSuccess: (data) => {
      console.log('Admin remove success, invalidating cache:', data);
      // Multiple cache invalidation strategies to force refresh
      queryClient.removeQueries({ queryKey: ['/api/admin/manage/list'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/manage/list'] });
      queryClient.refetchQueries({ queryKey: ['/api/admin/manage/list'] });
      
      // Force reload after short delay
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['/api/admin/manage/list'] });
      }, 500);
    },
  });

  return {
    adminList: adminList || [],
    isLoadingAdmins,
    addAdmin: addAdminMutation.mutateAsync,
    removeAdmin: (targetEmail: string, password: string) => 
      removeAdminMutation.mutateAsync({ targetEmail, password }),
    isAddingAdmin: addAdminMutation.isPending,
    isRemovingAdmin: removeAdminMutation.isPending,
  };
}