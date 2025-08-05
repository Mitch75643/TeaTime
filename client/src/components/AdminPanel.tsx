import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminAuth, useAdminManagement } from "@/hooks/useAdminAuth";
import { getDeviceFingerprint } from "@/lib/fingerprint";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { 
  Shield, 
  ShieldCheck, 
  ShieldX, 
  UserPlus, 
  UserMinus, 
  Crown, 
  Settings,
  Trash2,
  AlertTriangle,
  Loader2,
  UserX,
  Search,
  Calendar,
  Clock
} from "lucide-react";

export function AdminPanel() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showRootHostConfirm, setShowRootHostConfirm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newAdminData, setNewAdminData] = useState({
    fingerprint: '',
    fingerprintLabel: '',
    email: '',
    role: 'admin' as 'admin' | 'root_host'
  });
  const [error, setError] = useState('');
  
  const { toast } = useToast();
  const { isAuthenticated, admin, isRootHost } = useAdminAuth();
  const {
    adminList,
    isLoadingAdmins,
    addAdmin,
    removeAdmin,
    isAddingAdmin,
    isRemovingAdmin
  } = useAdminManagement();

  // Fetch banned users
  const { data: bannedUsers, isLoading: isLoadingBanned } = useQuery({
    queryKey: ['/api/admin/banned-users'],
    retry: false,
  });

  // Filter banned users based on search term
  const filteredBannedUsers = bannedUsers?.filter((ban: any) => 
    ban.fingerprint?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ban.reason?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Only root host can access admin panel
  if (!isAuthenticated || !isRootHost) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <ShieldX className="w-5 h-5 text-red-600" />
            Access Denied
          </CardTitle>
          <CardDescription>
            Only the root host can access the admin management panel.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newAdminData.fingerprint || !newAdminData.email || !newAdminData.fingerprintLabel) {
      setError('All fields are required');
      return;
    }

    try {
      const result = await addAdmin(newAdminData);
      
      if (result.success) {
        toast({
          title: "Admin Added",
          description: result.message,
        });
        
        // Reset form
        setNewAdminData({
          fingerprint: '',
          fingerprintLabel: '',
          email: '',
          role: 'admin'
        });
        setShowAddForm(false);
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add admin');
    }
  };

  const handleRemoveAdmin = async (email: string, role: string) => {
    if (role === 'root_host') {
      toast({
        title: "Cannot Remove Root Host",
        description: "Root host cannot be removed from the system.",
        variant: "destructive",
      });
      return;
    }

    if (window.confirm(`Are you sure you want to remove admin: ${email}?`)) {
      try {
        const result = await removeAdmin(email);
        
        if (result.success) {
          toast({
            title: "Admin Removed",
            description: result.message,
          });
        } else {
          toast({
            title: "Failed to Remove Admin",
            description: result.message,
            variant: "destructive",
          });
        }
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message || 'Failed to remove admin',
          variant: "destructive",
        });
      }
    }
  };

  const generateCurrentFingerprint = async () => {
    try {
      const fingerprint = await getDeviceFingerprint();
      setNewAdminData(prev => ({ ...prev, fingerprint }));
      toast({
        title: "Fingerprint Generated",
        description: "Current device fingerprint has been added to the form.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate device fingerprint",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-600" />
            Admin Management Panel
          </CardTitle>
          <CardDescription>
            Manage admin access and permissions. Only you (root host) can add or remove admins.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Current Admin List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Current Admins ({adminList.length})
            </span>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              disabled={isAddingAdmin}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Admin
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {isLoadingAdmins ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading admins...</span>
            </div>
          ) : (
            adminList.map((admin, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{admin.email}</span>
                    <Badge variant={admin.isRootHost ? "default" : "secondary"}>
                      {admin.isRootHost ? "Root Host" : "Admin"}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500">
                    Device: {admin.fingerprintLabel}
                  </div>
                  <div className="text-xs text-gray-400">
                    Fingerprint: {admin.fingerprint.slice(0, 16)}...
                  </div>
                  {admin.lastLogin && (
                    <div className="text-xs text-gray-400">
                      Last login: {new Date(admin.lastLogin).toLocaleString()}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {admin.isRootHost ? (
                    <Badge variant="outline" className="text-yellow-600">
                      <Crown className="w-3 h-3 mr-1" />
                      Protected
                    </Badge>
                  ) : (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveAdmin(admin.email, admin.role)}
                      disabled={isRemovingAdmin}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Add Admin Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Admin</CardTitle>
            <CardDescription>
              Add a new admin by providing their device fingerprint and email address.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fingerprintLabel">Device Label</Label>
                <Input
                  id="fingerprintLabel"
                  value={newAdminData.fingerprintLabel}
                  onChange={(e) => setNewAdminData(prev => ({ ...prev, fingerprintLabel: e.target.value }))}
                  placeholder="e.g., John's MacBook, Office Desktop"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fingerprint">Device Fingerprint</Label>
                <div className="flex gap-2">
                  <Input
                    id="fingerprint"
                    value={newAdminData.fingerprint}
                    onChange={(e) => setNewAdminData(prev => ({ ...prev, fingerprint: e.target.value }))}
                    placeholder="Device fingerprint"
                    className="font-mono text-sm"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateCurrentFingerprint}
                  >
                    Use Current Device
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={newAdminData.email}
                  onChange={(e) => setNewAdminData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="admin@example.com"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={newAdminData.role}
                  onValueChange={(value: 'admin' | 'root_host') => {
                    if (value === 'root_host') {
                      setShowRootHostConfirm(true);
                    } else {
                      setNewAdminData(prev => ({ ...prev, role: value }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="root_host">Root Host</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Root Host Confirmation Dialog */}
                <AlertDialog open={showRootHostConfirm} onOpenChange={setShowRootHostConfirm}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        Confirm Root Host Role
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to assign Root Host privileges to this user? Root hosts have full administrative control and can manage all admins, including removing other administrators.
                        <br /><br />
                        <strong>Warning:</strong> This gives them the same level of access as you.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setShowRootHostConfirm(false)}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => {
                          setNewAdminData(prev => ({ ...prev, role: 'root_host' }));
                          setShowRootHostConfirm(false);
                        }}
                        className="bg-yellow-600 hover:bg-yellow-700"
                      >
                        Yes, Assign Root Host
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              
              <Separator />
              
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={isAddingAdmin}
                >
                  {isAddingAdmin && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add Admin
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setError('');
                    setNewAdminData({
                      fingerprint: '',
                      fingerprintLabel: '',
                      email: '',
                      role: 'admin'
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

    </div>
  );
}

// Separate Banned Users Component
export function BannedUsersPanel() {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch banned users
  const { data: bannedUsers, isLoading: isLoadingBanned } = useQuery({
    queryKey: ['/api/admin/banned-users'],
    retry: false,
  });

  // Filter banned users based on search term
  const filteredBannedUsers = bannedUsers?.filter((ban: any) => 
    ban.fingerprint?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ban.reason?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const activeBans = filteredBannedUsers.filter((ban: any) => ban.isActive);
  const expiredBans = filteredBannedUsers.filter((ban: any) => !ban.isActive);

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto">
      {/* Header with Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserX className="w-5 h-5 text-red-600" />
            Banned Users Management
          </CardTitle>
          <CardDescription>
            Monitor and manage banned devices with advanced search and filtering capabilities.
          </CardDescription>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{activeBans.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Active Bans</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-950/20 p-3 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{expiredBans.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Expired Bans</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{bannedUsers?.length || 0}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Records</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search by Fingerprint ID or Reason</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Enter fingerprint ID or ban reason..."
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Banned Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Banned Devices ({filteredBannedUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingBanned ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="ml-3 text-lg">Loading banned users...</span>
            </div>
          ) : filteredBannedUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Device Fingerprint</TableHead>
                  <TableHead>Ban Reason</TableHead>
                  <TableHead>Banned Date</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Banned By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBannedUsers.map((ban: any, index: number) => (
                  <TableRow key={index} className={ban.isActive ? "bg-red-50/50 dark:bg-red-950/10" : "bg-gray-50/50 dark:bg-gray-950/10"}>
                    <TableCell>
                      <Badge variant={ban.isActive ? "destructive" : "secondary"}>
                        {ban.isActive ? "ACTIVE" : "EXPIRED"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm">
                        {ban.fingerprint}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Device #{index + 1}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        {ban.reason || 'Violation of platform rules'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-3 h-3" />
                        {new Date(ban.bannedAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <Clock className="w-3 h-3" />
                        {new Date(ban.bannedAt).toLocaleTimeString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {ban.expiresAt ? (
                        <div>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="w-3 h-3" />
                            {new Date(ban.expiresAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <Clock className="w-3 h-3" />
                            {new Date(ban.expiresAt).toLocaleTimeString()}
                          </div>
                        </div>
                      ) : (
                        <Badge variant="outline">Permanent</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {ban.bannedBy || 'System'}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <UserX className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium text-foreground mb-2">
                {searchTerm ? 'No Results Found' : 'No Banned Users'}
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {searchTerm 
                  ? `No banned users match your search for "${searchTerm}". Try a different search term.`
                  : 'There are currently no banned users on the platform. All users are in good standing.'
                }
              </p>
              {searchTerm && (
                <Button
                  variant="outline"
                  onClick={() => setSearchTerm('')}
                  className="mt-4"
                >
                  Clear Search
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}