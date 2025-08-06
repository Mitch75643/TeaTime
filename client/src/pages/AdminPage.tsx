import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AdminAuth } from "@/components/AdminAuth";
import { AdminPanel, BannedUsersPanel, RestrictedUsersPanel } from "@/components/AdminPanel";
import { UserManagementPanel } from "@/components/UserManagementPanel";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useToast } from "@/hooks/use-toast";
import { Shield, Settings, Users, UserX, UserMinus, ArrowLeft, Lock, Database, Search, Copy, Eye } from "lucide-react";
import { useLocation } from "wouter";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("auth");
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
  const [exitPassword, setExitPassword] = useState("");
  const [exitError, setExitError] = useState("");
  const { isAuthenticated, isRootHost } = useAdminAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleExitAdmin = () => {
    if (exitPassword === "NewYork/Boston/Wichita/area2025!") {
      toast({
        title: "Admin Access Closed",
        description: "Returning to main application.",
      });
      setLocation("/");
    } else {
      setExitError("Incorrect password. Access denied.");
    }
  };

  const closeExitDialog = () => {
    setIsExitDialogOpen(false);
    setExitPassword("");
    setExitError("");
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 relative">
          {/* Password-protected back button */}
          <Dialog open={isExitDialogOpen} onOpenChange={setIsExitDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="absolute left-0 top-0 flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Exit Admin
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Exit Admin Access
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="exit-password">Enter admin password to exit:</Label>
                  <Input
                    id="exit-password"
                    type="password"
                    value={exitPassword}
                    onChange={(e) => {
                      setExitPassword(e.target.value);
                      setExitError("");
                    }}
                    placeholder="Enter password..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleExitAdmin();
                      }
                    }}
                  />
                  {exitError && (
                    <p className="text-sm text-destructive">{exitError}</p>
                  )}
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={closeExitDialog}>
                    Cancel
                  </Button>
                  <Button onClick={handleExitAdmin}>
                    Exit Admin
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <h1 className="text-3xl font-bold text-foreground mb-2">
            Admin Access
          </h1>
          <p className="text-muted-foreground">
            Secure admin management system with two-step verification
          </p>
        </div>

        {!isAuthenticated ? (
          <AdminAuth onSuccess={() => setActiveTab("management")} />
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 gap-2 max-w-5xl mx-auto mb-8 p-2 h-auto">
              <TabsTrigger value="auth" className="flex items-center gap-2 px-3 py-3 text-sm font-medium">
                <Shield className="w-4 h-4" />
                Authentication
              </TabsTrigger>
              <TabsTrigger 
                value="management" 
                className="flex items-center gap-2 px-3 py-3 text-sm font-medium"
                disabled={!isRootHost}
              >
                <Settings className="w-4 h-4" />
                Admin Management
              </TabsTrigger>
              <TabsTrigger 
                value="users" 
                className="flex items-center gap-2 px-3 py-3 text-sm font-medium"
                disabled={!isRootHost}
              >
                <Database className="w-4 h-4" />
                User Management
              </TabsTrigger>
              <TabsTrigger 
                value="banned" 
                className="flex items-center gap-2 px-3 py-3 text-sm font-medium"
                disabled={!isRootHost}
              >
                <UserX className="w-4 h-4" />
                Banned Users
              </TabsTrigger>
              <TabsTrigger 
                value="restricted" 
                className="flex items-center gap-2 px-3 py-3 text-sm font-medium"
                disabled={!isRootHost}
              >
                <UserMinus className="w-4 h-4" />
                Restricted Users
              </TabsTrigger>
            </TabsList>

            <TabsContent value="auth">
              <AdminAuth />
            </TabsContent>

            <TabsContent value="management">
              {isRootHost ? (
                <AdminPanel />
              ) : (
                <div className="text-center py-8">
                  <Settings className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    Admin Management
                  </h2>
                  <p className="text-muted-foreground">
                    Only the root host can access admin management features.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="users">
              {isRootHost ? (
                <UserManagementPanel />
              ) : (
                <div className="text-center py-8">
                  <Database className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    User Management
                  </h2>
                  <p className="text-muted-foreground">
                    Only the root host can access user management features.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="banned">
              {isRootHost ? (
                <BannedUsersPanel />
              ) : (
                <div className="text-center py-8">
                  <UserX className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    Banned Users
                  </h2>
                  <p className="text-muted-foreground">
                    Only the root host can view banned users information.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="restricted">
              {isRootHost ? (
                <RestrictedUsersPanel />
              ) : (
                <div className="text-center py-8">
                  <UserMinus className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    Restricted Users
                  </h2>
                  <p className="text-muted-foreground">
                    Only the root host can view restricted users information.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}