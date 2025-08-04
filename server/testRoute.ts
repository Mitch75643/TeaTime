// Temporary test route to trigger notifications for development
import type { Express } from "express";
import { memAutoRotationService } from "./memAutoRotationService";

export function addTestRoute(app: Express) {
  // Test route to manually trigger rotation (for development)
  app.post("/api/test/trigger-rotation", async (req, res) => {
    try {
      console.log('[Test] Manually triggering daily prompt rotation...');
      await memAutoRotationService.rotateDailyPrompt();
      
      console.log('[Test] Manually triggering daily debate rotation...');
      await memAutoRotationService.rotateDailyDebate();
      
      res.json({ 
        success: true, 
        message: "Rotation triggered successfully. Check console for notification logs." 
      });
    } catch (error) {
      console.error('[Test] Failed to trigger rotation:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to trigger rotation", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
}