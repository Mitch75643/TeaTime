import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, RefreshCw, Eye, Users, Database, Copy } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  alias: string | null;
  avatarId: string | null;
  avatarColor: string | null;
  deviceFingerprint: string;
  sessionId: string | null;
  createdAt: string;
  lastActivity: string | null;
  postCount: number;
}

export function UserManagementPanel() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading, error } = useQuery<User[]>({
    queryKey: ['/api/admin/users/all'],
    staleTime: 30000, // 30 seconds
    retry: 1
  });

  const filteredUsers = (users as User[]).filter((user: User) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (user.alias && user.alias.toLowerCase().includes(search)) ||
      user.deviceFingerprint.toLowerCase().includes(search) ||
      (user.sessionId && user.sessionId.toLowerCase().includes(search)) ||
      user.id.toLowerCase().includes(search)
    );
  });

  const refreshUserList = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/admin/users/all'] });
    toast({
      title: "User List Refreshed",
      description: "Successfully updated user management data."
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard.`
    });
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            User Management
          </CardTitle>
          <CardDescription>Error loading user data</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">Failed to load users: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Management
            </div>
            <Button
              onClick={refreshUserList}
              variant="outline"
              size="sm"
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardTitle>
          <CardDescription>
            Comprehensive user lookup and management system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and Stats */}
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by username, fingerprint, session, or user ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="flex items-center gap-2">
                  <Database className="w-3 h-3" />
                  Total: {(users as User[]).length}
                </Badge>
                {searchTerm && (
                  <Badge variant="outline" className="flex items-center gap-2">
                    <Search className="w-3 h-3" />
                    Filtered: {filteredUsers.length}
                  </Badge>
                )}
              </div>
            </div>

            {/* User List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                Loading users...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No users match your search criteria.' : 'No users found.'}
              </div>
            ) : (
              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {filteredUsers.map((user: User, index: number) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/50"
                  >
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="min-w-12 text-center">
                        #{index + 1}
                      </Badge>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {user.alias || 'No Username'}
                          </span>
                          {user.postCount > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {user.postCount} posts
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 font-mono">
                          {user.deviceFingerprint.substring(0, 12)}...
                        </p>
                        {user.createdAt && (
                          <p className="text-xs text-gray-400">
                            Joined: {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                          onClick={() => setSelectedUser(user)}
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </Button>
                      </DialogTrigger>
                      
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            User Details: {user.alias || 'Anonymous User'}
                          </DialogTitle>
                        </DialogHeader>
                        
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                User ID
                              </Label>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded flex-1">
                                  {user.id}
                                </p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyToClipboard(user.id, 'User ID')}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            
                            <div>
                              <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Username/Alias
                              </Label>
                              <p className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">
                                {user.alias || 'Not set'}
                              </p>
                            </div>
                            
                            <div>
                              <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Avatar Information
                              </Label>
                              <div className="space-y-1">
                                <p className="text-xs">ID: {user.avatarId || 'Not set'}</p>
                                <p className="text-xs">Color: {user.avatarColor || 'Not set'}</p>
                              </div>
                            </div>
                            
                            <div>
                              <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Post Count
                              </Label>
                              <p className="text-sm">{user.postCount}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-4 border-t pt-4">
                            <div>
                              <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Device Fingerprint
                              </Label>
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded flex-1">
                                  {user.deviceFingerprint}
                                </p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyToClipboard(user.deviceFingerprint, 'Device Fingerprint')}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            
                            <div>
                              <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Session ID
                              </Label>
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded flex-1">
                                  {user.sessionId || 'Not available'}
                                </p>
                                {user.sessionId && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copyToClipboard(user.sessionId!, 'Session ID')}
                                  >
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                            {user.createdAt && (
                              <div>
                                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                  Account Created
                                </Label>
                                <p className="text-sm">{new Date(user.createdAt).toLocaleString()}</p>
                              </div>
                            )}
                            
                            {user.lastActivity && (
                              <div>
                                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                  Last Activity
                                </Label>
                                <p className="text-sm">{new Date(user.lastActivity).toLocaleString()}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}