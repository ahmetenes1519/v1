import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  Ban, 
  Trash2, 
  AlertTriangle,
  Search,
  UserX,
  MessageSquare,
  BarChart3,
  Settings
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';

interface BannedUser {
  id: string;
  email: string;
  name: string;
  reason: string;
  bannedAt: string;
  bannedBy: string;
  ipAddress?: string;
  deviceInfo?: string;
}

const AdminPage: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [showBanModal, setShowBanModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [banReason, setBanReason] = useState('');
  const [banType, setBanType] = useState<'email' | 'ip' | 'device'>('email');
  const [users, setUsers] = useState<any[]>([]);
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [adminLoading, setAdminLoading] = useState(true);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'users', label: 'Kullanıcı Yönetimi', icon: Users },
    { id: 'content', label: 'İçerik Yönetimi', icon: MessageSquare },
    { id: 'reports', label: 'Şikayetler', icon: AlertTriangle },
    { id: 'bans', label: 'Yasaklılar', icon: Ban },
    { id: 'settings', label: 'Ayarlar', icon: Settings },
  ];

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadAdminData();
    }
  }, [user]);

  const loadAdminData = async () => {
    try {
      setAdminLoading(true);
      
      const postsResponse = await fetch('/api/posts');
      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        setAllPosts(postsData);
      }

      setUsers([
        { id: '1', name: 'Ahmet Yılmaz', email: 'ahmet@example.com', role: 'user', verified: true },
        { id: '2', name: 'Fatma Kaya', email: 'fatma@example.com', role: 'user', verified: true },
        { id: '3', name: 'Platform Yöneticisi', email: 'admin@example.com', role: 'admin', verified: true }
      ]);

    } catch (error) {
      console.error('Admin data loading error:', error);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleBanUser = (targetUser: any) => {
    setSelectedUser(targetUser);
    setShowBanModal(true);
  };

  const executeBan = () => {
    if (!selectedUser || !banReason.trim()) return;

    const newBan: BannedUser = {
      id: Date.now().toString(),
      email: selectedUser.email,
      name: selectedUser.name,
      reason: banReason,
      bannedAt: new Date().toISOString(),
      bannedBy: user?.email || 'admin',
      ipAddress: banType === 'ip' ? '192.168.1.1' : undefined,
      deviceInfo: banType === 'device' ? 'Chrome/Windows' : undefined
    };

    setBannedUsers(prev => [...prev, newBan]);
    
    const existingBans = JSON.parse(localStorage.getItem('bannedUsers') || '[]');
    localStorage.setItem('bannedUsers', JSON.stringify([...existingBans, newBan]));

    setShowBanModal(false);
    setBanReason('');
    setSelectedUser(null);
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setAllPosts(prev => prev.filter(post => post.id !== postId));
      }
    } catch (error) {
      console.error('Delete post error:', error);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPosts = allPosts.filter(post => 
    post.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Admin access check
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <Shield size={48} className="mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Erişim Reddedildi
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Bu sayfaya erişim için admin yetkisi gereklidir.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">Admin verileri yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Admin Paneli
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Platform yönetimi ve moderasyon araçları
          </p>
        </div>

        <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Toplam Kullanıcı
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {users.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Toplam Gönderi
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {allPosts.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Bekleyen Şikayetler
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    0
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <Ban className="h-8 w-8 text-red-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Yasaklı Kullanıcı
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {bannedUsers.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div>
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Gönderi ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Gönderi Yönetimi ({filteredPosts.length} gönderi)
                </h3>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPosts.map((post) => (
                  <div key={post.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            {post.users?.name || 'Bilinmeyen Kullanıcı'}
                          </h4>
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                            {new Date(post.created_at).toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 mb-2">
                          {post.content}
                        </p>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <span>{post.likes_count} beğeni</span>
                          <span className="mx-2">•</span>
                          <span>{post.comments_count} yorum</span>
                          <span className="mx-2">•</span>
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                            {post.category}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 flex items-center space-x-2">
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Gönderiyi sil"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Kullanıcı ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Kullanıcı Listesi ({filteredUsers.length} kullanıcı)
                </h3>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="p-6 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </p>
                      </div>
                      {user.verified && (
                        <div className="ml-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {user.role === 'admin' ? 'Admin' : 'Kullanıcı'}
                      </span>
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => handleBanUser(user)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Kullanıcıyı yasakla"
                        >
                          <UserX size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {(activeTab === 'reports' || activeTab === 'bans' || activeTab === 'settings') && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Bu bölüm henüz geliştirilmekte
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {activeTab === 'reports' && 'Şikayet yönetimi özelliği yakında eklenecek.'}
              {activeTab === 'bans' && 'Yasaklı kullanıcı yönetimi özelliği yakında eklenecek.'}
              {activeTab === 'settings' && 'Platform ayarları özelliği yakında eklenecek.'}
            </p>
          </div>
        )}
      </div>

      {showBanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Kullanıcıyı Yasakla
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {selectedUser?.name} ({selectedUser?.email}) kullanıcısını yasaklamak istediğinizden emin misiniz?
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Yasaklama Sebebi
              </label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Yasaklama sebebini yazın..."
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Yasaklama Türü
              </label>
              <select
                value={banType}
                onChange={(e) => setBanType(e.target.value as 'email' | 'ip' | 'device')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="email">E-posta Adresi</option>
                <option value="ip">IP Adresi</option>
                <option value="device">Cihaz Bilgisi</option>
              </select>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowBanModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={executeBan}
                disabled={!banReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                Yasakla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;