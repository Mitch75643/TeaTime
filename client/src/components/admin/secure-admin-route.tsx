import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import AdminPage from "@/pages/AdminPage";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export function SecureAdminRoute() {
  const [, setLocation] = useLocation();
  const [isVerifying, setIsVerifying] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    // Check if user has passed password verification
    const checkPasswordVerification = async () => {
      try {
        const response = await fetch("/api/admin/check-password-access", {
          method: "GET",
          credentials: "include"
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.verified) {
            setHasAccess(true);
          } else {
            // Redirect to settings if no password verification
            setLocation("/profile");
          }
        } else {
          setLocation("/profile");
        }
      } catch (error) {
        console.error("Admin access check failed:", error);
        setLocation("/profile");
      } finally {
        setIsVerifying(false);
      }
    };

    checkPasswordVerification();
  }, [setLocation]);

  if (isVerifying) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Verifying access...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              You need to verify your admin access through Settings first.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User has access, render the admin page
  return <AdminPage />;
}