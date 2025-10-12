import React, { useState } from 'react';
import { Search, Filter, Eye, Edit, Shield, ShieldOff, Trash2, Users, UserCheck, UserX, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../components/ui/alert-dialog';
import { mockUsers } from '../../adminmock';
import { useToast } from '../../hooks/use-toast';

const ManageUsers = () => {
  const [users, setUsers] = useState(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const { toast } = useToast();

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleBlockUser = (userId) => {
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, status: user.status === 'Active' ? 'Blocked' : 'Active' }
        : user
    ));
    const user = users.find(u => u.id === userId);
    toast({
      title: user.status === 'Active' ? "User Blocked" : "User Unblocked",
      description: `${user.name} has been ${user.status === 'Active' ? 'blocked' : 'unblocked'}.`,
    });
  };

  const handleDeleteUser = (userId) => {
    setUsers(prev => prev.filter(user => user.id !== userId));
    toast({
      title: "User Deleted",
      description: "The user has been permanently deleted from the system.",
      variant: "destructive",
    });
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'Admin': return <Crown className="h-4 w-4" />;
      case 'NGO': return <Users className="h-4 w-4" />;
      case 'Donor': return <UserCheck className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'Admin': return 'bg-purple-100 text-purple-800';
      case 'NGO': return 'bg-blue-100 text-blue-800';
      case 'Donor': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Blocked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const UserDetailsModal = ({ user }) => (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>User Details</DialogTitle>
      </DialogHeader>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src="/placeholder-avatar.jpg" />
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
                <span className="ml-1">{user.role}</span>
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
              <p>{new Date(user.joinDate).toLocaleDateString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Location</label>
              <p>{user.location}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Last Activity</label>
              <p>{new Date(user.lastActivity).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="space-y-4">
            {user.role === 'Donor' && (
              <div>
                <label className="text-sm font-medium text-gray-600">Total Donations</label>
                <p className="text-2xl font-bold text-green-600">{user.totalDonations || 0}</p>
              </div>
            )}
            {user.role === 'NGO' && (
              <div>
                <label className="text-sm font-medium text-gray-600">Total Requests</label>
                <p className="text-2xl font-bold text-blue-600">{user.totalRequests || 0}</p>
              </div>
            )}
            {user.role === 'Admin' && (
              <div>
                <label className="text-sm font-medium text-gray-600">Admin Actions</label>
                <p className="text-2xl font-bold text-purple-600">{user.totalActions || 0}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-600">Account Status</label>
              <p className={`font-medium ${user.status === 'Active' ? 'text-green-600' : 'text-red-600'}`}>
                {user.status}
              </p>
            </div>
          </div>
        </div>

        <div className="flex space-x-3 pt-4 border-t">
          <Button className="flex-1">
            <Edit className="h-4 w-4 mr-2" />
            Edit User
          </Button>
          <Button
            variant={user.status === 'Active' ? 'destructive' : 'default'}
            className="flex-1"
            onClick={() => handleBlockUser(user.id)}
          >
            {user.status === 'Active' ? (
              <>
                <ShieldOff className="h-4 w-4 mr-2" />
                Block User
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Unblock User
              </>
            )}
          </Button>
        </div>
      </div>
    </DialogContent>
  );

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
            {users.filter(u => u.status === 'Active').length} Active Users
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
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'Donor').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">NGOs</p>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'NGO').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserX className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Blocked</p>
                <p className="text-2xl font-bold">{users.filter(u => u.status === 'Blocked').length}</p>
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
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="NGO">NGO</SelectItem>
                <SelectItem value="Donor">Donor</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Blocked">Blocked</SelectItem>
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
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src="/placeholder-avatar.jpg" />
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
                      <span className="ml-1">{user.role}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(user.status)}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(user.joinDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div>
                      {user.role === 'Donor' && (
                        <p className="text-sm"><span className="font-medium">{user.totalDonations || 0}</span> donations</p>
                      )}
                      {user.role === 'NGO' && (
                        <p className="text-sm"><span className="font-medium">{user.totalRequests || 0}</span> requests</p>
                      )}
                      {user.role === 'Admin' && (
                        <p className="text-sm"><span className="font-medium">{user.totalActions || 0}</span> actions</p>
                      )}
                      <p className="text-xs text-gray-500">Last: {new Date(user.lastActivity).toLocaleDateString()}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => setSelectedUser(user)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <UserDetailsModal user={user} />
                      </Dialog>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={user.status === 'Active' ? 'destructive' : 'default'}
                        onClick={() => handleBlockUser(user.id)}
                      >
                        {user.status === 'Active' ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete User</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {user.name}? This action cannot be undone and will permanently remove all user data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>
                              Delete User
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManageUsers;