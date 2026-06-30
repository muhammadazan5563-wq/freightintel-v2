import React, { useState, useEffect } from 'react';
import { Users, Activity, DollarSign, Server, Edit2, Save, X, Search, Ban, UserPlus, Shield, Trash2, CheckCircle, RefreshCw, Plus } from 'lucide-react';
import { User, BlockedIP } from '../types';
import { PLAN_DAILY_LIMITS, PlanName } from '../config/permissions';
import { 
  fetchUsersFromSupabase, 
  createUserInSupabase, 
  updateUserInSupabase, 
  deleteUserFromSupabase,
  fetchBlockedIPsFromSupabase,
  blockIPInSupabase,
  unblockIPInSupabase
} from '../services/userService';

const formatLastActive = (lastActive: string): string => {
  if (!lastActive || lastActive === 'Never') return 'Inactive';
  if (lastActive === 'Now') return 'Now';
  const date = new Date(lastActive);
  if (isNaN(date.getTime())) return lastActive;
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
};

export const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'blocked' | 'add'>('users');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserPlan, setNewUserPlan] = useState<PlanName>('Insurance');
  const [newUserRole, setNewUserRole] = useState<'user' | 'admin'>('user');
  
  const [blockIpAddress, setBlockIpAddress] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [editingAllowedIps, setEditingAllowedIps] = useState<string | null>(null);
  const [newAllowedIp, setNewAllowedIp] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersData, blockedIPsData] = await Promise.all([
        fetchUsersFromSupabase(),
        fetchBlockedIPsFromSupabase()
      ]);
      setUsers(usersData);
      setBlockedIPs(blockedIPsData);
    } catch (err) {
      console.error('Error loading data:', err);
      showMessage('error', 'Failed to load data from database');
    }
    setIsLoading(false);
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const activeUsers = users.filter(u => u.isOnline).length;
  const totalRevenue = users.reduce((acc, user) => {
    if (user.plan === 'Professional') return acc + 149;
    if (user.plan === 'Insurance') return acc + 499;
    return acc;
  }, 0);

  const handleEdit = (user: User) => {
    setEditingId(user.id);
    setEditForm(user);
  };

  const handleSave = async () => {
    if (!editingId) return;
    
    setIsSaving(true);
    const updatedUser = { ...users.find(u => u.id === editingId)!, ...editForm };
    
    const success = await updateUserInSupabase(updatedUser);
    
    if (success) {
      setUsers(users.map(u => (u.id === editingId ? updatedUser : u)));
      showMessage('success', 'User updated successfully');
    } else {
      showMessage('error', 'Failed to update user');
    }
    
    setEditingId(null);
    setIsSaving(false);
  };

  const handleBlockUser = async (user: User) => {
    setIsSaving(true);
    const updatedUser = { ...user, isBlocked: !user.isBlocked };
    
    const success = await updateUserInSupabase(updatedUser);
    
    if (success) {
      setUsers(users.map(u => u.id === user.id ? updatedUser : u));
      showMessage('success', user.isBlocked ? 'User unblocked' : 'User blocked');
    } else {
      showMessage('error', 'Failed to update user status');
    }
    
    setIsSaving(false);
  };

  const handleBlockIP = async () => {
    if (!blockIpAddress.trim()) return;
    
    setIsSaving(true);
    const success = await blockIPInSupabase(blockIpAddress.trim(), blockReason.trim());
    
    if (success) {
      const newBlockedIP: BlockedIP = {
        ip: blockIpAddress.trim(),
        blockedAt: new Date().toISOString(),
        reason: blockReason.trim() || 'No reason provided'
      };
      setBlockedIPs([newBlockedIP, ...blockedIPs]);
      setBlockIpAddress('');
      setBlockReason('');
      showMessage('success', 'IP address blocked');
    } else {
      showMessage('error', 'Failed to block IP address');
    }
    
    setIsSaving(false);
  };

  const handleUnblockIP = async (ip: string) => {
    setIsSaving(true);
    const success = await unblockIPInSupabase(ip);
    
    if (success) {
      setBlockedIPs(blockedIPs.filter(b => b.ip !== ip));
      showMessage('success', 'IP address unblocked');
    } else {
      showMessage('error', 'Failed to unblock IP address');
    }
    
    setIsSaving(false);
  };

  const handleAddUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      showMessage('error', 'Name, email, and password are required');
      return;
    }
    
    if (users.find(u => u.email.toLowerCase() === newUserEmail.toLowerCase())) {
      showMessage('error', 'User with this email already exists!');
      return;
    }

    setIsSaving(true);
    
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: newUserName.trim(),
      email: newUserEmail.trim().toLowerCase(),
      role: newUserRole,
      plan: newUserPlan,
      dailyLimit: PLAN_DAILY_LIMITS[newUserPlan],
      recordsExtractedToday: 0,
      lastActive: 'Never',
      ipAddress: '',
      isOnline: false,
      isBlocked: false
    };

    const createdUser = await createUserInSupabase(newUser, newUserPassword.trim());
    
    if (createdUser) {
      setUsers([createdUser, ...users]);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserPlan('Insurance');
      setNewUserRole('user');
      setActiveTab('users');
      showMessage('success', 'User created successfully');
    } else {
      showMessage('error', 'Failed to create user');
    }
    
    setIsSaving(false);
  };

  const handleDeleteUser = async (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if (userToDelete?.role === 'admin') {
      showMessage('error', 'Cannot delete admin user!');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    setIsSaving(true);
    const success = await deleteUserFromSupabase(userId);
    
    if (success) {
      setUsers(users.filter(u => u.id !== userId));
      showMessage('success', 'User deleted successfully');
    } else {
      showMessage('error', 'Failed to delete user');
    }
    
    setIsSaving(false);
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-full bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-slate-500">Loading admin data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-fade-in h-full overflow-y-auto bg-white">
      {message && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
          message.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {message.text}
        </div>
      )}

      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin Control Center</h1>
          <p className="text-slate-500">System analytics, user management, and IP blocking.</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg transition-colors shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 px-4 py-2 rounded-full">
             <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
             <span className="text-red-600 font-mono text-xs font-semibold">LIVE ENVIRONMENT</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Active Sessions', value: activeUsers, icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Total Users', value: users.length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Monthly Revenue', value: `$${totalRevenue}`, icon: DollarSign, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Blocked IPs', value: blockedIPs.length, icon: Ban, color: 'text-red-500', bg: 'bg-red-50' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <span className="text-slate-500 text-sm font-medium">{stat.label}</span>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 border-b border-slate-200 pb-4">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
            activeTab === 'users' 
              ? 'text-white shadow-md' 
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-slate-200'
          }`}
          style={activeTab === 'users' ? { background: 'linear-gradient(135deg, #7C5CFC, #9B7EFD)', boxShadow: '0 4px 16px rgba(124,92,252,0.25)' } : undefined}
        >
          <Users className="w-4 h-4 inline mr-2" />
          User Management
        </button>
        <button
          onClick={() => setActiveTab('blocked')}
          className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
            activeTab === 'blocked' 
              ? 'text-white shadow-md' 
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-slate-200'
          }`}
          style={activeTab === 'blocked' ? { background: 'linear-gradient(135deg, #7C5CFC, #9B7EFD)', boxShadow: '0 4px 16px rgba(124,92,252,0.25)' } : undefined}
        >
          <Ban className="w-4 h-4 inline mr-2" />
          Blocked IPs ({blockedIPs.length})
        </button>
        <button
          onClick={() => setActiveTab('add')}
          className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
            activeTab === 'add' 
              ? 'text-white shadow-md' 
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-slate-200'
          }`}
          style={activeTab === 'add' ? { background: 'linear-gradient(135deg, #7C5CFC, #9B7EFD)', boxShadow: '0 4px 16px rgba(124,92,252,0.25)' } : undefined}
        >
          <UserPlus className="w-4 h-4 inline mr-2" />
          Add User
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col min-h-[500px] shadow-sm">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">User Directory ({users.length} users)</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Status</th>
                  <th className="p-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Identity</th>
                  <th className="p-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Role</th>
                  <th className="p-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Plan</th>
                  <th className="p-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Daily Limit</th>
                  <th className="p-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Usage</th>
                  <th className="p-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">IP Address</th>
                  <th className="p-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Allowed IPs</th>
                  <th className="p-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      {searchTerm ? 'No users found matching your search.' : 'No users in database. Add a user to get started.'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className={`hover:bg-slate-50 transition-colors ${user.isBlocked ? 'opacity-50 bg-red-50/50' : ''}`}>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${user.isBlocked ? 'bg-red-500' : user.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          <span className="text-slate-700">{user.isBlocked ? 'Blocked' : user.isOnline ? 'Online' : formatLastActive(user.lastActive)}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-900">{user.name}</div>
                        <div className="text-xs text-slate-400">{user.email}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          user.role === 'admin' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {user.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4">
                         {editingId === user.id ? (
                            <select 
                              className="bg-white border border-slate-300 rounded p-1 text-slate-900 text-sm"
                              value={editForm.plan}
                              onChange={e => setEditForm({...editForm, plan: e.target.value as any})}
                            >
                              <option value="Basic">Basic</option>
                              <option value="Essential">Essential</option>
                              <option value="Professional">Professional</option>
                              <option value="Insurance">Insurance</option>
                            </select>
                         ) : (
                            <span className={`px-2 py-1 rounded text-xs font-bold border 
                              ${user.plan === 'Insurance' ? 'bg-purple-50 text-purple-600 border-purple-200' : 
                                user.plan === 'Professional' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 
                                user.plan === 'Essential' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                'bg-slate-100 text-slate-600 border-slate-200'}`}>
                              {user.plan}
                            </span>
                         )}
                      </td>
                      <td className="p-4 font-mono text-slate-700">
                        {editingId === user.id ? (
                          <input 
                            type="number"
                            className="bg-white border border-slate-300 rounded p-1 text-slate-900 w-24 text-sm"
                            value={editForm.dailyLimit}
                            onChange={e => setEditForm({...editForm, dailyLimit: parseInt(e.target.value)})}
                          />
                        ) : (
                          user.dailyLimit.toLocaleString()
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-200 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full ${user.recordsExtractedToday > user.dailyLimit * 0.9 ? 'bg-red-500' : 'bg-indigo-500'}`} 
                              style={{ width: `${Math.min((user.recordsExtractedToday / user.dailyLimit) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500">{user.recordsExtractedToday}</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-xs text-slate-400">{user.ipAddress}</td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1 items-center max-w-[200px]">
                          {(user.allowedIps || []).map((ip, i) => (
                            <span key={i} className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded px-1.5 py-0.5 text-[10px] font-mono">
                              {ip}
                              <button
                                onClick={async () => {
                                  const updated = { ...user, allowedIps: (user.allowedIps || []).filter((_, idx) => idx !== i) };
                                  const success = await updateUserInSupabase(updated);
                                  if (success) { setUsers(users.map(u => u.id === user.id ? updated : u)); showMessage('success', 'IP removed'); }
                                  else showMessage('error', 'Failed to remove IP');
                                }}
                                className="text-red-400 hover:text-red-600"
                                title="Remove IP"
                              >
                                <X size={10} />
                              </button>
                            </span>
                          ))}
                          {editingAllowedIps === user.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={newAllowedIp}
                                onChange={(e) => setNewAllowedIp(e.target.value)}
                                placeholder="IP"
                                className="w-24 bg-white border border-slate-300 rounded px-1 py-0.5 text-[10px] font-mono outline-none focus:border-indigo-400"
                                onKeyDown={async (e) => {
                                  if (e.key === 'Enter' && newAllowedIp.trim()) {
                                    const updated = { ...user, allowedIps: [...(user.allowedIps || []), newAllowedIp.trim()] };
                                    const success = await updateUserInSupabase(updated);
                                    if (success) { setUsers(users.map(u => u.id === user.id ? updated : u)); setNewAllowedIp(''); showMessage('success', 'IP added'); }
                                    else showMessage('error', 'Failed to add IP');
                                  }
                                }}
                              />
                              <button onClick={() => { setEditingAllowedIps(null); setNewAllowedIp(''); }} className="text-slate-400 hover:text-slate-600"><X size={12} /></button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setEditingAllowedIps(user.id); setNewAllowedIp(''); }}
                              className="inline-flex items-center gap-0.5 text-[10px] text-indigo-500 hover:text-indigo-700 font-semibold"
                              title="Add allowed IP"
                            >
                              <Plus size={10} /> Add
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          {editingId === user.id ? (
                            <>
                              <button 
                                onClick={handleSave} 
                                disabled={isSaving}
                                className="p-1.5 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 border border-emerald-200 disabled:opacity-50" 
                                title="Save"
                              >
                                <Save size={16} />
                              </button>
                              <button onClick={() => setEditingId(null)} className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 border border-red-200" title="Cancel">
                                <X size={16} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => handleEdit(user)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors border border-transparent hover:border-slate-200" title="Edit">
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => handleBlockUser(user)} 
                                disabled={isSaving}
                                className={`p-1.5 rounded transition-colors border disabled:opacity-50 ${user.isBlocked ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200' : 'bg-red-50 text-red-600 hover:bg-red-100 border-red-200'}`}
                                title={user.isBlocked ? 'Unblock User' : 'Block User'}
                              >
                                {user.isBlocked ? <CheckCircle size={16} /> : <Ban size={16} />}
                              </button>
                              {user.role !== 'admin' && (
                                <button 
                                  onClick={() => handleDeleteUser(user.id)} 
                                  disabled={isSaving}
                                  className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50"
                                  title="Delete User"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'blocked' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Ban className="w-5 h-5 text-red-500" />
              Block New IP Address
            </h3>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm text-slate-500 mb-1 font-medium">IP Address</label>
                <input
                  type="text"
                  placeholder="e.g., 192.168.1.100"
                  value={blockIpAddress}
                  onChange={(e) => setBlockIpAddress(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm text-slate-500 mb-1 font-medium">Reason (optional)</label>
                <input
                  type="text"
                  placeholder="e.g., Suspicious activity"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleBlockIP}
                  disabled={isSaving || !blockIpAddress.trim()}
                  className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 shadow-sm"
                >
                  Block IP
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Blocked IP Addresses</h3>
            </div>
            {blockedIPs.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No IP addresses are currently blocked.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="p-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">IP Address</th>
                    <th className="p-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Blocked At</th>
                    <th className="p-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Reason</th>
                    <th className="p-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {blockedIPs.map((blocked, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-mono text-slate-900 font-semibold">{blocked.ip}</td>
                      <td className="p-4 text-slate-600">{new Date(blocked.blockedAt).toLocaleString()}</td>
                      <td className="p-4 text-slate-600">{blocked.reason}</td>
                      <td className="p-4">
                        <button
                          onClick={() => handleUnblockIP(blocked.ip)}
                          disabled={isSaving}
                          className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 border border-emerald-200 transition-colors text-xs font-semibold disabled:opacity-50"
                        >
                          Unblock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {activeTab === 'add' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-2xl shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-indigo-500" />
            Add New User
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-500 mb-1 font-medium">Full Name *</label>
              <input
                type="text"
                placeholder="John Doe"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-1 font-medium">Email Address *</label>
              <input
                type="email"
                placeholder="john@company.com"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-1 font-medium">Password *</label>
              <input
                type="password"
                placeholder="Set a password for this user"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-500 mb-1 font-medium">Plan</label>
                <select
                  value={newUserPlan}
                  onChange={(e) => setNewUserPlan(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                >
                  <option value="Basic">Basic (50 MCs/day)</option>
                  <option value="Essential">Essential (100 MCs/day)</option>
                  <option value="Professional">Professional (500 MCs/day)</option>
                  <option value="Insurance">Insurance (Unlimited)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-500 mb-1 font-medium">Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="pt-4">
              <button
                onClick={handleAddUser}
                disabled={isSaving || !newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 shadow-sm"
              >
                {isSaving ? 'Creating...' : 'Create User Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
