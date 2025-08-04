import { bannedDevices, type BannedDevice } from "@shared/schema";
import { MemStorage } from "./storage";
import { eq } from "drizzle-orm";

export class BanSystem {
  constructor(private storage: MemStorage) {}

  // Check if a device is banned
  async isDeviceBanned(deviceFingerprint: string): Promise<{ banned: boolean; banInfo?: BannedDevice }> {
    try {
      const banRecord = await this.storage.getBannedDevice(deviceFingerprint);
      
      if (!banRecord) {
        return { banned: false };
      }

      // Check if temporary ban has expired
      if (banRecord.isTemporary && banRecord.expiresAt) {
        const now = new Date();
        const expiresAt = new Date(banRecord.expiresAt);
        
        if (now > expiresAt) {
          // Ban has expired, remove it
          await this.storage.removeBannedDevice(deviceFingerprint);
          return { banned: false };
        }
      }

      return { banned: true, banInfo: banRecord };
    } catch (error) {
      console.error('Error checking device ban:', error);
      // Fail safe - don't ban on error
      return { banned: false };
    }
  }

  // Ban a device
  async banDevice(params: {
    deviceFingerprint: string;
    bannedBy: string;
    banReason: string;
    isTemporary?: boolean;
    expiresAt?: Date;
    deviceMetadata?: Record<string, any>;
  }): Promise<BannedDevice> {
    const { deviceFingerprint, bannedBy, banReason, isTemporary = false, expiresAt, deviceMetadata = {} } = params;

    try {
      const banRecord = await this.storage.createBannedDevice({
        deviceFingerprint,
        bannedBy,
        banReason,
        isTemporary,
        expiresAt: expiresAt?.toISOString(),
        deviceMetadata,
      });

      console.log(`Device banned: ${deviceFingerprint} by ${bannedBy} - ${banReason}`);
      return banRecord;
    } catch (error) {
      console.error('Error banning device:', error);
      throw new Error('Failed to ban device');
    }
  }

  // Unban a device (for appeals or admin actions)
  async unbanDevice(deviceFingerprint: string, unbannedBy: string): Promise<boolean> {
    try {
      const removed = await this.storage.removeBannedDevice(deviceFingerprint);
      if (removed) {
        console.log(`Device unbanned: ${deviceFingerprint} by ${unbannedBy}`);
      }
      return removed;
    } catch (error) {
      console.error('Error unbanning device:', error);
      throw new Error('Failed to unban device');
    }
  }

  // Get all banned devices (for admin dashboard)
  async getAllBannedDevices(): Promise<BannedDevice[]> {
    try {
      return await this.storage.getAllBannedDevices();
    } catch (error) {
      console.error('Error fetching banned devices:', error);
      return [];
    }
  }

  // Update ban (extend time, change reason, etc.)
  async updateBan(deviceFingerprint: string, updates: Partial<BannedDevice>): Promise<boolean> {
    try {
      return await this.storage.updateBannedDevice(deviceFingerprint, updates);
    } catch (error) {
      console.error('Error updating ban:', error);
      throw new Error('Failed to update ban');
    }
  }

  // Get ban statistics
  async getBanStats(): Promise<{
    totalBans: number;
    activeBans: number;
    temporaryBans: number;
    permanentBans: number;
    expiredBans: number;
  }> {
    try {
      const allBans = await this.storage.getAllBannedDevices();
      const now = new Date();

      let activeBans = 0;
      let temporaryBans = 0;
      let permanentBans = 0;
      let expiredBans = 0;

      for (const ban of allBans) {
        if (ban.isTemporary && ban.expiresAt) {
          temporaryBans++;
          const expiresAt = new Date(ban.expiresAt);
          if (now > expiresAt) {
            expiredBans++;
          } else {
            activeBans++;
          }
        } else {
          permanentBans++;
          activeBans++;
        }
      }

      return {
        totalBans: allBans.length,
        activeBans,
        temporaryBans,
        permanentBans,
        expiredBans,
      };
    } catch (error) {
      console.error('Error getting ban stats:', error);
      return {
        totalBans: 0,
        activeBans: 0,
        temporaryBans: 0,
        permanentBans: 0,
        expiredBans: 0,
      };
    }
  }

  // Clean up expired bans (should be run periodically)
  async cleanupExpiredBans(): Promise<number> {
    try {
      const allBans = await this.storage.getAllBannedDevices();
      const now = new Date();
      let cleanedCount = 0;

      for (const ban of allBans) {
        if (ban.isTemporary && ban.expiresAt) {
          const expiresAt = new Date(ban.expiresAt);
          if (now > expiresAt) {
            await this.storage.removeBannedDevice(ban.deviceFingerprint);
            cleanedCount++;
          }
        }
      }

      if (cleanedCount > 0) {
        console.log(`Cleaned up ${cleanedCount} expired bans`);
      }

      return cleanedCount;
    } catch (error) {
      console.error('Error cleaning up expired bans:', error);
      return 0;
    }
  }
}

// Middleware function to check device bans
export async function checkDeviceBan(deviceFingerprint: string, banSystem: BanSystem) {
  const { banned, banInfo } = await banSystem.isDeviceBanned(deviceFingerprint);
  
  if (banned && banInfo) {
    return {
      banned: true,
      banReason: banInfo.banReason,
      isTemporary: banInfo.isTemporary,
      expiresAt: banInfo.expiresAt,
      bannedBy: banInfo.bannedBy,
    };
  }
  
  return { banned: false };
}