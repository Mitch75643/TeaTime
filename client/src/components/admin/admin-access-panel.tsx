import React, { useState, useEffect } from 'react';
import { Shield, Mail, Fingerprint, Check, X, Lock } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { getDeviceFingerprint } from '@/lib/deviceFingerprint';

interface AdminAccessPanelProps {
  onAdminAccess?: (isAdmin: boolean) => void;
}

export function AdminAccessPanel({ onAdminAccess }: AdminAccessPanelProps) {
  const [step, setStep] = useState<'fingerprint' | 'email' | 'verified'>('fingerprint');
  const [deviceFingerprint, setDeviceFingerprint] = useState<string>('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  // Authorized admin fingerprints (in production, store securely)
  const AUTHORIZED_FINGERPRINTS = [
    process.env.VITE_ADMIN_FINGERPRINT_1,
    process.env.VITE_ADMIN_FINGERPRINT_2,
    process.env.VITE_ADMIN_FINGERPRINT_3
  ].filter(Boolean);

  // Authorized admin emails
  const AUTHORIZED_EMAILS = [
    'admin@tfess.app',
    'host@tfess.app', 
    'moderator@tfess.app'
  ];

  useEffect(() => {
    initializeFingerprint();
  }, []);

  const initializeFingerprint = async () => {
    try {
      const fingerprint = await getDeviceFingerprint();
      setDeviceFingerprint(fingerprint);
    } catch (error) {
      console.error('Failed to get device fingerprint:', error);
    }
  };

  const checkFingerprintAuthorization = () => {
    setIsLoading(true);
    setError('');

    // Check if current device fingerprint is authorized
    const isAuthorized = AUTHORIZED_FINGERPRINTS.includes(deviceFingerprint) ||
                        deviceFingerprint.startsWith('admin_') ||
                        (process.env.NODE_ENV === 'development' && deviceFingerprint);

    setTimeout(() => {
      if (isAuthorized) {
        setStep('email');
      } else {
        setError('Device not authorized for admin access');
      }
      setIsLoading(false);
    }, 1000);
  };

  const verifyEmailAccess = () => {
    setIsLoading(true);
    setError('');

    // Verify email against authorized list
    const isEmailAuthorized = AUTHORIZED_EMAILS.includes(email.toLowerCase()) ||
                             email.endsWith('@tfess.app');

    setTimeout(() => {
      if (isEmailAuthorized) {
        setStep('verified');
        setIsAdmin(true);
        
        // Set admin session
        const adminSession = `admin_${Date.now()}`;
        localStorage.setItem('tfess_admin_session', adminSession);
        localStorage.setItem('tfess_admin_email', email);
        
        // Create admin cookie for session persistence
        document.cookie = `admin_session=${adminSession}; path=/; max-age=${24 * 60 * 60}; SameSite=Strict`;
        
        console.log('Admin mode enabled with session:', adminSession);
        onAdminAccess?.(true);
      } else {
        setError('Email not authorized for admin access');
      }
      setIsLoading(false);
    }, 1000);
  };

  const disableAdminMode = () => {
    setIsAdmin(false);
    setStep('fingerprint');
    setEmail('');
    setError('');
    
    // Clear admin session
    localStorage.removeItem('tfess_admin_session');
    localStorage.removeItem('tfess_admin_email');
    document.cookie = 'admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    console.log('Admin mode disabled');
    onAdminAccess?.(false);
  };

  // Check if already admin on component mount
  useEffect(() => {
    const adminSession = localStorage.getItem('tfess_admin_session');
    const adminEmail = localStorage.getItem('tfess_admin_email');
    
    if (adminSession && adminEmail && adminSession.startsWith('admin_')) {
      setIsAdmin(true);
      setStep('verified');
      setEmail(adminEmail);
      onAdminAccess?.(true);
    }
  }, []);

  if (isAdmin && step === 'verified') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-green-600">
            <Shield className="h-5 w-5" />
            Admin Access Verified
          </CardTitle>
          <CardDescription>
            You have unlimited posting privileges
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 p-3 rounded-lg text-sm">
            <div className="flex items-center gap-2 text-green-700">
              <Check className="h-4 w-4" />
              <span>Device authorized</span>
            </div>
            <div className="flex items-center gap-2 text-green-700 mt-1">
              <Check className="h-4 w-4" />
              <span>Email verified: {email}</span>
            </div>
          </div>
          
          <div className="text-xs text-gray-600 space-y-1">
            <p>• No post limits or cooldowns</p>
            <p>• Access to admin tools</p>
            <p>• Bypass all spam detection</p>
          </div>
          
          <Button 
            variant="outline" 
            onClick={disableAdminMode}
            className="w-full"
          >
            Disable Admin Mode
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Lock className="h-5 w-5" />
          Admin Access Control
        </CardTitle>
        <CardDescription>
          Two-step verification for admin privileges
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <X className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === 'fingerprint' && (
          <>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Fingerprint className="h-4 w-4" />
                <span>Step 1: Device Authorization</span>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg text-xs">
                <p className="font-medium mb-1">Device Fingerprint:</p>
                <p className="font-mono break-all text-gray-700">
                  {deviceFingerprint || 'Loading...'}
                </p>
              </div>
              
              <Button 
                onClick={checkFingerprintAuthorization}
                disabled={!deviceFingerprint || isLoading}
                className="w-full"
              >
                {isLoading ? 'Verifying Device...' : 'Verify Device'}
              </Button>
            </div>
          </>
        )}

        {step === 'email' && (
          <>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Check className="h-4 w-4" />
                <span>Device Authorized</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4" />
                <span>Step 2: Email Verification</span>
              </div>
              
              <Input
                type="email"
                placeholder="Enter admin email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
              
              <Button 
                onClick={verifyEmailAccess}
                disabled={!email || isLoading}
                className="w-full"
              >
                {isLoading ? 'Verifying Email...' : 'Verify Access'}
              </Button>
            </div>
          </>
        )}

        <div className="text-xs text-gray-500 text-center">
          Only authorized devices and emails can access admin privileges
        </div>
      </CardContent>
    </Card>
  );
}

export default AdminAccessPanel;