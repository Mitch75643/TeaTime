import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminAuth } from "@/components/AdminAuth";
import { AdminPanel } from "@/components/AdminPanel";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Shield, Settings, Users } from "lucide-react";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("auth");
  const { isAuthenticated, isRootHost } = useAdminAuth();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Access
          </h1>
          <p className="text-gray-600">
            Secure admin management system with two-step verification
          </p>
        </div>

        {!isAuthenticated ? (
          <AdminAuth onSuccess={() => setActiveTab("management")} />
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
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
            </TabsList>

            <TabsContent value="auth">
              <AdminAuth />
            </TabsContent>

            <TabsContent value="management">
              {isRootHost ? (
                <AdminPanel />
              ) : (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h2 className="text-xl font-semibold text-gray-700 mb-2">
                    Admin Management
                  </h2>
                  <p className="text-gray-500">
                    Only the root host can access admin management features.
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