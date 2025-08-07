import { Request, Response, NextFunction } from "express";
import { BanSystem } from "./banSystem";
import { storage } from "./storage";

// Initialize ban system
export const banSystem = new BanSystem(storage);

// Middleware to check device bans on every request
export async function checkDeviceBanMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Get device fingerprint from various sources
    const deviceFingerprint = 
      req.body?.deviceFingerprint || 
      req.query?.deviceFingerprint ||
      req.headers['x-device-fingerprint'];

    if (!deviceFingerprint) {
      // If no fingerprint, continue without ban check
      return next();
    }

    const { banned, banInfo } = await banSystem.isDeviceBanned(deviceFingerprint as string);

    if (banned && banInfo) {
      // Device is banned, return ban information
      return res.status(403).json({
        banned: true,
        banReason: banInfo.banReason,
        isTemporary: banInfo.isTemporary,
        expiresAt: banInfo.expiresAt,
        message: "Access denied - device is banned from Postyn due to policy violations"
      });
    }

    // Device is not banned, continue
    next();
  } catch (error) {
    console.error('Ban check middleware error:', error);
    // On error, allow access (fail-safe)
    next();
  }
}

// Strict ban middleware for protected actions (posting, commenting)
export async function strictBanCheckMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const deviceFingerprint = 
      req.body?.deviceFingerprint || 
      req.query?.deviceFingerprint ||
      req.headers['x-device-fingerprint'];

    if (!deviceFingerprint) {
      // For strict actions, require fingerprint
      return res.status(400).json({
        error: "Device fingerprint required for this action"
      });
    }

    const { banned, banInfo } = await banSystem.isDeviceBanned(deviceFingerprint as string);

    if (banned && banInfo) {
      return res.status(403).json({
        banned: true,
        banReason: banInfo.banReason,
        isTemporary: banInfo.isTemporary,
        expiresAt: banInfo.expiresAt,
        action: "blocked",
        message: "This device is banned and cannot perform this action"
      });
    }

    next();
  } catch (error) {
    console.error('Strict ban check middleware error:', error);
    return res.status(500).json({ error: "Ban check failed" });
  }
}

// Clean up expired bans periodically
export function startBanCleanupScheduler() {
  // Clean up expired bans every hour
  setInterval(async () => {
    try {
      const cleanedCount = await banSystem.cleanupExpiredBans();
      if (cleanedCount > 0) {
        console.log(`[Ban Cleanup] Removed ${cleanedCount} expired bans`);
      }
    } catch (error) {
      console.error('Ban cleanup error:', error);
    }
  }, 60 * 60 * 1000); // 1 hour

  console.log('[Ban System] Cleanup scheduler started');
}