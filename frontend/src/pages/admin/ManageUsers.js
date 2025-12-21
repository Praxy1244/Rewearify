import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Eye, Edit, Shield, ShieldOff, Users, UserCheck, UserX, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { adminService } from '../../services';
import { toast } from 'sonner';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [page, setPage] = useState(1);

  // --- MAIN FETCH FUNCTION ---
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      
      // ✅ FIX: Request 100 users to ensure Recipients are loaded
      const response = await adminService.getAllUsers({ 
        page: page,
        limit: 100, 
        role: roleFilter === 'all' ? undefined : roleFilter,
        search: searchTerm || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter
      });
      
      if (response.success) {
        setUsers(response.data || []);
      } else {
        setError('Failed to fetch users');
        toast.error('Failed to load users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to fetch users');
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, searchTerm, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Client-side filtering
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleBlockUser = async (userId) => {
    try {
      const user = users.find(u => u._id === userId);
      const newStatus = user.status === 'active' ? 'suspended' : 'active';
      
      const response = await adminService.updateUserStatus(userId, newStatus, 
        newStatus === 'suspended' ? 'Blocked by admin' : 'Activated by admin'
      );
      
      if (response.success) {
        setUsers(prev => prev.map(u => 
          u._id === userId ? { ...u, status: newStatus } : u
        ));
        toast.success(`User ${newStatus === 'suspended' ? 'suspended' : 'activated'} successfully`);
      } else {
        toast.error('Failed to update user status');
      }
    } catch (err) {
      console.error('Error updating user status:', err);
      toast.error('Failed to update user status');
    }
  };

  // Helper functions
  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4" />;
      case 'recipient': return <Users className="h-4 w-4" />;
      case 'donor': return <UserCheck className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'recipient': return 'bg-blue-100 text-blue-800';
      case 'donor': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'banned': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // --- MODAL COMPONENT (With Date Fixes) ---
  const UserDetailsModal = ({ user }) => (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>User Details</DialogTitle>
      </DialogHeader>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.profile?.profilePicture?.url} />
            <AvatarFallback className="text-lg">
              {user.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-xl font-semibold">{user.name}</h3>
            <p className="text-gray-600">{user.email}</p>
            <div className="flex items-center space-x-2 mt-2">
              <Badge className={getRoleColor(user.role)}>
                {getRoleIcon(user.role)}
                <span className="ml-1 capitalize">{user.role}</span>
              </Badge>
              <Badge className={getStatusColor(user.status)}>
                {user.status}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Join Date</label>
              {/* ✅ FIXED DATE CHECK */}
              <p>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Location</label>
              <p>{user.location?.city || 'Not specified'}, {user.location?.state || ''}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Last Activity</label>
              {/* ✅ FIXED DATE CHECK */}
              <p>{(user.lastActive || user.updatedAt) ? new Date(user.lastActive || user.updatedAt).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>
          <div className="space-y-4">
            {user.role === 'donor' && (
              <div>
                <label className="text-sm font-medium text-gray-600">Total Donations</label>
                <p className="text-2xl font-bold text-green-600">{user.statistics?.totalDonations || 0}</p>
              </div>
            )}
            {user.role === 'recipient' && (
              <div>
                <label className="text-sm font-medium text-gray-600">Total Requests</label>
                <p className="text-2xl font-bold text-blue-600">{user.statistics?.totalRequests || 0}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-600">Account Status</label>
              <p className={`font-medium capitalize ${user.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                {user.status}
              </p>
            </div>
          </div>
        </div>

        <div className="flex space-x-3 pt-4 border-t">
          <Button className="flex-1" variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit User
          </Button>
          <Button
            variant={user.status === 'active' ? 'destructive' : 'default'}
            className="flex-1"
            onClick={() => handleBlockUser(user._id)}
          >
            {user.status === 'active' ? (
              <>
                <ShieldOff className="h-4 w-4 mr-2" />
                Suspend User
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Reactivate User
              </>
            )}
          </Button>
        </div>
      </div>
    </DialogContent>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Users</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchUsers} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Users</h1>
          <p className="text-gray-600 mt-1">Manage all users, roles, and permissions</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="text-green-600">
            {users.filter(u => u.status === 'active').length} Active Users
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Donors</p>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'donor').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Recipients</p>
                <p className="text-2xl font-bold text-blue-600">
                  {users.filter(u => u.role === 'recipient').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserX className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Suspended</p>
                <p className="text-2xl font-bold">{users.filter(u => u.status === 'suspended').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="recipient">Recipient</SelectItem>
                <SelectItem value="donor">Donor</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={user.profile?.profilePicture?.url} />
                        <AvatarFallback>
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleColor(user.role)}>
                      {getRoleIcon(user.role)}
                      <span className="ml-1 capitalize">{user.role}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(user.status)}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  {/* ✅ FIXED DATE CHECK */}
                  <TableCell>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell>
                    <div>
                      {user.role === 'donor' && (
                        <p className="text-sm"><span className="font-medium">{user.statistics?.totalDonations || 0}</span> donations</p>
                      )}
                      {user.role === 'recipient' && (
                        <p className="text-sm"><span className="font-medium">{user.statistics?.totalRequests || 0}</span> requests</p>
                      )}
                      {/* ✅ FIXED DATE CHECK */}
                      <p className="text-xs text-gray-500">
                        Last: {(user.lastActive || user.updatedAt) ? new Date(user.lastActive || user.updatedAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => setSelectedUser(user)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={user.status === 'active' ? 'destructive' : 'default'}
                        onClick={() => handleBlockUser(user._id)}
                      >
                        {user.status === 'active' ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        {selectedUser && <UserDetailsModal user={selectedUser} />}
      </Dialog>
    </div>
  );
};

export default ManageUsers;
