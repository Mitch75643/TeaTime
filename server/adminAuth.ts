import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import { 
  adminFingerprints, 
  adminEmails, 
  adminSessions, 
  adminActivityLog,
  type AdminLogin,
  type AddAdmin
} from '../shared/admin-schema';

interface AdminAuthRequest extends Request {
  adminUser?: {
    email: string;
    fingerprint: string;
    role: string;
    sessionId: string;
  };
}

class AdminAuthService {
  // Check if fingerprint is authorized for admin access
  async isAuthorizedFingerprint(fingerprint: string): Promise<boolean> {
    try {
      const adminFingerprint = await storage.getAdminFingerprint(fingerprint);
      return adminFingerprint?.isActive || false;
    } catch (error) {
      console.error('Error checking fingerprint authorization:', error);
      return false;
    }
  }

  // Verify admin email and fingerprint combination
  async verifyAdminCredentials(fingerprint: string, email: string): Promise<{
    valid: boolean;
    role?: string;
    errors?: string[];
  }> {
    try {
      const errors: string[] = [];

      // Step 1: Check if fingerprint is authorized
      const fingerprintAuth = await storage.getAdminFingerprint(fingerprint);
      if (!fingerprintAuth || !fingerprintAuth.isActive) {
        errors.push('Unauthorized device');
      }

      // Step 2: Check if email is authorized for this fingerprint
      const emailAuth = await storage.getAdminEmail(email, fingerprint);
      if (!emailAuth || !emailAuth.isActive) {
        errors.push('Unauthorized email for this device');
      }

      if (errors.length > 0) {
        return { valid: false, errors };
      }

      return { 
        valid: true, 
        role: emailAuth!.role 
      };
    } catch (error) {
      console.error('Error verifying admin credentials:', error);
      return { valid: false, errors: ['Authentication error'] };
    }
  }

  // Create admin session after successful verification
  async createAdminSession(fingerprint: string, email: string, sessionId: string): Promise<boolean> {
    try {
      const emailRecord = await storage.getAdminEmail(email, fingerprint);
      if (!emailRecord) return false;

      // Create session record
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await storage.createAdminSession({
        sessionId,
        fingerprint,
        email,
        role: emailRecord.role,
        expiresAt: expiresAt.toISOString(),
      });

      // Update last login
      await storage.updateAdminEmailLastLogin(email);

      // Log admin login
      await this.logAdminActivity(email, fingerprint, 'admin_login', null, {
        sessionId,
        timestamp: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Error creating admin session:', error);
      return false;
    }
  }

  // Verify active admin session
  async verifyAdminSession(sessionId: string): Promise<{
    valid: boolean;
    admin?: {
      email: string;
      fingerprint: string;
      role: string;
      sessionId: string;
    };
  }> {
    try {
      const session = await storage.getAdminSession(sessionId);
      
      if (!session) {
        return { valid: false };
      }
      
      // Check if session is active
      if (session.isActive === false) {
        return { valid: false };
      }

      // Check if session has expired
      const now = new Date();
      const expiresAt = new Date(session.expiresAt);
      
      if (now > expiresAt) {
        await storage.deactivateAdminSession(sessionId);
        return { valid: false };
      }

      // Update last activity
      await storage.updateAdminSessionActivity(sessionId);

      return {
        valid: true,
        admin: {
          email: session.email,
          fingerprint: session.fingerprint,
          role: session.role,
          sessionId: session.sessionId
        }
      };
    } catch (error) {
      console.error('Error verifying admin session:', error);
      return { valid: false };
    }
  }

  // Check if user is root host
  async isRootHost(email: string, fingerprint: string): Promise<boolean> {
    try {
      const fingerprintRecord = await storage.getAdminFingerprint(fingerprint);
      const emailRecord = await storage.getAdminEmail(email, fingerprint);
      
      return (fingerprintRecord?.isRootHost && emailRecord?.role === 'root_host') || false;
    } catch (error) {
      console.error('Error checking root host status:', error);
      return false;
    }
  }

  // Add new admin (only root host can do this)
  async addAdmin(addedBy: string, addedByFingerprint: string, adminData: AddAdmin): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // Verify the person adding is root host
      const isRootHost = await this.isRootHost(addedBy, addedByFingerprint);
      if (!isRootHost) {
        return { success: false, message: 'Only root host can add admins' };
      }

      // Check if fingerprint already exists
      const existingFingerprint = await storage.getAdminFingerprint(adminData.fingerprint);
      if (existingFingerprint) {
        return { success: false, message: 'Fingerprint already registered' };
      }

      // Check if email already exists
      const existingEmail = await storage.getAdminEmailByEmail(adminData.email);
      if (existingEmail) {
        return { success: false, message: 'Email already registered' };
      }

      // Add fingerprint
      await storage.createAdminFingerprint({
        fingerprint: adminData.fingerprint,
        label: adminData.fingerprintLabel,
        addedBy,
        isRootHost: adminData.role === 'root_host',
      });

      // Add email
      await storage.createAdminEmail({
        email: adminData.email,
        fingerprint: adminData.fingerprint,
        role: adminData.role,
        addedBy,
      });

      // Log activity
      await this.logAdminActivity(addedBy, addedByFingerprint, 'add_admin', adminData.email, {
        newAdminEmail: adminData.email,
        newAdminRole: adminData.role,
        fingerprintLabel: adminData.fingerprintLabel
      });

      return { success: true, message: 'Admin added successfully' };
    } catch (error) {
      console.error('Error adding admin:', error);
      return { success: false, message: 'Failed to add admin' };
    }
  }

  // Remove admin (only root host can do this, can't remove root host)
  async removeAdmin(removedBy: string, removedByFingerprint: string, targetEmail: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // Verify the person removing is root host
      const isRootHost = await this.isRootHost(removedBy, removedByFingerprint);
      if (!isRootHost) {
        return { success: false, message: 'Only root host can remove admins' };
      }

      // Check if target admin exists
      const targetAdmin = await storage.getAdminEmailByEmail(targetEmail);
      if (!targetAdmin) {
        return { success: false, message: 'Admin not found' };
      }

      // Prevent removing root host
      if (targetAdmin.role === 'root_host') {
        return { success: false, message: 'Cannot remove root host' };
      }

      // Deactivate admin
      await storage.deactivateAdminEmail(targetEmail);
      await storage.deactivateAdminFingerprint(targetAdmin.fingerprint);

      // Deactivate all sessions for this admin
      await storage.deactivateAdminSessionsByEmail(targetEmail);

      // Log activity
      await this.logAdminActivity(removedBy, removedByFingerprint, 'remove_admin', targetEmail, {
        removedAdminEmail: targetEmail,
        removedAdminRole: targetAdmin.role
      });

      return { success: true, message: 'Admin removed successfully' };
    } catch (error) {
      console.error('Error removing admin:', error);
      return { success: false, message: 'Failed to remove admin' };
    }
  }

  // Log admin activity
  async logAdminActivity(
    adminEmail: string, 
    fingerprint: string, 
    action: string, 
    targetResource: string | null, 
    details: any,
    req?: Request
  ): Promise<void> {
    try {
      await storage.createAdminActivityLog({
        adminEmail,
        fingerprint,
        action,
        targetResource,
        details: JSON.stringify(details),
        ipAddress: req?.ip || 'unknown',
        userAgent: req?.get('User-Agent') || 'unknown',
      });
    } catch (error) {
      console.error('Error logging admin activity:', error);
    }
  }

  // Get admin list (only for root host)
  async getAdminList(requestedBy: string, requestedByFingerprint: string): Promise<{
    success: boolean;
    admins?: any[];
    message?: string;
  }> {
    try {
      const isRootHost = await this.isRootHost(requestedBy, requestedByFingerprint);
      if (!isRootHost) {
        return { success: false, message: 'Only root host can view admin list' };
      }

      const admins = await storage.getAllActiveAdmins();
      return { success: true, admins };
    } catch (error) {
      console.error('Error getting admin list:', error);
      return { success: false, message: 'Failed to retrieve admin list' };
    }
  }
}

export const adminAuthService = new AdminAuthService();

// Middleware to check admin authentication
export function requireAdminAuth(req: AdminAuthRequest, res: Response, next: NextFunction) {
  return async (req: AdminAuthRequest, res: Response, next: NextFunction) => {
    try {
      const sessionId = req.session.id;
      if (!sessionId) {
        return res.status(401).json({ message: 'Session required' });
      }

      const verification = await adminAuthService.verifyAdminSession(sessionId);
      if (!verification.valid) {
        return res.status(401).json({ message: 'Admin authentication required' });
      }

      req.adminUser = verification.admin;
      next();
    } catch (error) {
      console.error('Admin auth middleware error:', error);
      res.status(500).json({ message: 'Authentication error' });
    }
  };
}

// Middleware to check root host privileges
export function requireRootHost(req: AdminAuthRequest, res: Response, next: NextFunction) {
  if (!req.adminUser || req.adminUser.role !== 'root_host') {
    return res.status(403).json({ message: 'Root host privileges required' });
  }
  next();
}