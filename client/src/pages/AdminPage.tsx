import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminAuth } from "@/components/AdminAuth";
import { AdminPanel, BannedUsersPanel, RestrictedUsersPanel } from "@/components/AdminPanel";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Shield, Settings, Users, UserX, UserMinus } from "lucide-react";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("auth");
  const { isAuthenticated, isRootHost } = useAdminAuth();

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
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
            <TabsList className="grid w-full grid-cols-4 max-w-3xl mx-auto mb-8">
              <TabsTrigger value="auth" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Authentication
              </TabsTrigger>
              <TabsTrigger 
                value="management" 
                className="flex items-center gap-2"
                disabled={!isRootHost}
              >
                <Users className="w-4 h-4" />
                Admin Management
              </TabsTrigger>
              <TabsTrigger 
                value="banned" 
                className="flex items-center gap-2"
                disabled={!isRootHost}
              >
                <UserX className="w-4 h-4" />
                Banned Users
              </TabsTrigger>
              <TabsTrigger 
                value="restricted" 
                className="flex items-center gap-2"
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
                  <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    Admin Management
                  </h2>
                  <p className="text-muted-foreground">
                    Only the root host can access admin management features.
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