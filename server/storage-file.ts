import fs from 'fs/promises';
import path from 'path';
import type { User, InsertUser, Post, InsertPost, DuaRequest, InsertDuaRequest, Comment, InsertComment, Community, InsertCommunity, Event, InsertEvent, Like, Bookmark, CommunityMember, EventAttendee, Report, InsertReport, UserBan, InsertUserBan } from "@shared/schema";

// Veri dosyalarının saklanacağı dizin
const DATA_DIR = path.join(process.cwd(), 'data');

// Veri dosyaları
const DATA_FILES = {
  users: path.join(DATA_DIR, 'users.json'),
  posts: path.join(DATA_DIR, 'posts.json'),
  duaRequests: path.join(DATA_DIR, 'dua-requests.json'),
  comments: path.join(DATA_DIR, 'comments.json'),
  likes: path.join(DATA_DIR, 'likes.json'),
  bookmarks: path.join(DATA_DIR, 'bookmarks.json'),
  communities: path.join(DATA_DIR, 'communities.json'),
  communityMembers: path.join(DATA_DIR, 'community-members.json'),
  events: path.join(DATA_DIR, 'events.json'),
  eventAttendees: path.join(DATA_DIR, 'event-attendees.json'),
  reports: path.join(DATA_DIR, 'reports.json'),
  userBans: path.join(DATA_DIR, 'user-bans.json')
};

// ID generator
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Dosya işlemleri için yardımcı sınıf
class FileStorage {
  private async ensureDataDir(): Promise<void> {
    try {
      await fs.access(DATA_DIR);
    } catch {
      await fs.mkdir(DATA_DIR, { recursive: true });
    }
  }

  private async readFile<T>(filePath: string): Promise<T[]> {
    try {
      await this.ensureDataDir();
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      // Dosya yoksa boş array döndür
      return [];
    }
  }

  private async writeFile<T>(filePath: string, data: T[]): Promise<void> {
    await this.ensureDataDir();
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  // Generic CRUD operations
  async getAll<T>(fileName: keyof typeof DATA_FILES): Promise<T[]> {
    return this.readFile<T>(DATA_FILES[fileName]);
  }

  async getById<T extends { id: string }>(fileName: keyof typeof DATA_FILES, id: string): Promise<T | undefined> {
    const items = await this.getAll<T>(fileName);
    return items.find(item => item.id === id);
  }

  async create<T extends { id?: string }>(fileName: keyof typeof DATA_FILES, item: T): Promise<T & { id: string }> {
    const items = await this.getAll<T & { id: string }>(fileName);
    const newItem = {
      ...item,
      id: item.id || generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as T & { id: string };
    
    items.push(newItem);
    await this.writeFile(DATA_FILES[fileName], items);
    return newItem;
  }

  async update<T extends { id: string }>(fileName: keyof typeof DATA_FILES, id: string, updates: Partial<T>): Promise<T | undefined> {
    const items = await this.getAll<T>(fileName);
    const index = items.findIndex(item => item.id === id);
    
    if (index === -1) return undefined;
    
    items[index] = {
      ...items[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    await this.writeFile(DATA_FILES[fileName], items);
    return items[index];
  }

  async delete<T extends { id: string }>(fileName: keyof typeof DATA_FILES, id: string): Promise<boolean> {
    const items = await this.getAll<T>(fileName);
    const index = items.findIndex(item => item.id === id);
    
    if (index === -1) return false;
    
    items.splice(index, 1);
    await this.writeFile(DATA_FILES[fileName], items);
    return true;
  }

  async findBy<T>(fileName: keyof typeof DATA_FILES, predicate: (item: T) => boolean): Promise<T[]> {
    const items = await this.getAll<T>(fileName);
    return items.filter(predicate);
  }
}

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  
  // Posts
  getPosts(limit?: number): Promise<(Post & { users: User })[]>;
  getPostById(id: string): Promise<(Post & { users: User }) | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  deletePost(id: string): Promise<boolean>;
  
  // Dua Requests
  getDuaRequests(limit?: number): Promise<(DuaRequest & { users: User })[]>;
  getDuaRequestById(id: string): Promise<(DuaRequest & { users: User }) | undefined>;
  createDuaRequest(duaRequest: InsertDuaRequest): Promise<DuaRequest>;
  
  // Comments
  getCommentsByPostId(postId: string): Promise<(Comment & { users: User })[]>;
  getCommentsByDuaRequestId(duaRequestId: string): Promise<(Comment & { users: User })[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  
  // Likes
  getUserLike(userId: string, postId?: string, duaRequestId?: string): Promise<Like | undefined>;
  toggleLike(userId: string, postId?: string, duaRequestId?: string): Promise<{ liked: boolean }>;
  
  // Bookmarks
  getUserBookmark(userId: string, postId?: string, duaRequestId?: string): Promise<Bookmark | undefined>;
  toggleBookmark(userId: string, postId?: string, duaRequestId?: string): Promise<{ bookmarked: boolean }>;
  
  // Communities
  getCommunities(limit?: number): Promise<(Community & { users: User })[]>;
  createCommunity(community: InsertCommunity): Promise<Community>;
  joinCommunity(communityId: string, userId: string): Promise<CommunityMember>;
  
  // Events
  getEvents(limit?: number): Promise<(Event & { users: User })[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  attendEvent(eventId: string, userId: string): Promise<EventAttendee>;
  
  // Reports
  createReport(report: InsertReport): Promise<Report>;
  getReports(limit?: number): Promise<(Report & { reporter: User; reportedUser: User; post?: Post; duaRequest?: DuaRequest })[]>;
  updateReportStatus(reportId: string, status: string, adminNotes?: string): Promise<Report | undefined>;
  
  // User Bans
  banUser(ban: InsertUserBan): Promise<UserBan>;
  getUserBans(userId: string): Promise<UserBan[]>;
  isUserBanned(userId: string): Promise<boolean>;
  
  // Health Check
  getDatabaseStatus(): any;
  checkHealth(): Promise<boolean>;
}

export class LocalFileStorage implements IStorage {
  private fileStorage = new FileStorage();

  constructor() {
    this.initializeData();
  }

  private async initializeData(): Promise<void> {
    try {
      // İlk çalıştırmada örnek veriler oluştur
      const users = await this.fileStorage.getAll<User>('users');
      if (users.length === 0) {
        await this.createInitialData();
      }
    } catch (error) {
      console.error('Veri başlatma hatası:', error);
    }
  }

  private async createInitialData(): Promise<void> {
    console.log('🕌 İlk veri seti oluşturuluyor...');

    // Örnek kullanıcılar
    const demoUsers = [
      {
        email: 'demo@islamic-platform.com',
        name: 'Demo Kullanıcı',
        username: 'demo_user',
        avatar_url: null,
        bio: 'İslami değerlere bağlı bir kardeşiniz',
        location: 'İstanbul',
        website: null,
        verified: true,
        role: 'user' as const
      },
      {
        email: 'admin@islamic-platform.com',
        name: 'Platform Yöneticisi',
        username: 'admin',
        avatar_url: null,
        bio: 'İslami sosyal platform yöneticisi',
        location: 'İstanbul',
        website: null,
        verified: true,
        role: 'admin' as const
      }
    ];

    const createdUsers = [];
    for (const userData of demoUsers) {
      const user = await this.createUser(userData);
      createdUsers.push(user);
    }

    // Örnek gönderiler
    const demoPosts = [
      {
        user_id: createdUsers[0].id,
        content: 'Selamün aleyküm kardeşlerim! Bu güzel İslami platformda olmaktan çok mutluyum. Allah hepimizi hayırda birleştirsin. 🤲',
        type: 'text' as const,
        media_url: null,
        category: 'Selamlaşma',
        tags: ['selam', 'kardeşlik', 'hayır']
      },
      {
        user_id: createdUsers[1].id,
        content: 'İslami sosyal platformumuza hoş geldiniz! Burada güzel paylaşımlar yapabilir, kardeşlerimizle etkileşimde bulunabilirsiniz. 🕌',
        type: 'text' as const,
        media_url: null,
        category: 'Duyuru',
        tags: ['hoşgeldin', 'platform', 'duyuru']
      },
      {
        user_id: createdUsers[0].id,
        content: 'Bugün çok güzel bir hadis okudum: "Müslüman, elinden ve dilinden Müslümanların emin olduğu kimsedir." (Buhari) 📖',
        type: 'text' as const,
        media_url: null,
        category: 'Hadis',
        tags: ['hadis', 'İslam', 'öğüt']
      }
    ];

    for (const postData of demoPosts) {
      await this.createPost(postData);
    }

    // Örnek dua talepleri
    const demoDuaRequests = [
      {
        user_id: createdUsers[0].id,
        title: 'Sağlık için dua talebi',
        content: 'Sevgili kardeşlerim, sağlığım için dua eder misiniz? Allah şifa versin inşallah.',
        category: 'Sağlık',
        is_urgent: false,
        is_anonymous: false,
        tags: ['sağlık', 'şifa', 'dua']
      }
    ];

    for (const duaData of demoDuaRequests) {
      await this.createDuaRequest(duaData);
    }

    console.log('✅ İlk veri seti başarıyla oluşturuldu!');
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.fileStorage.getById<User>('users', id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const users = await this.fileStorage.findBy<User>('users', user => user.username === username);
    return users[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const users = await this.fileStorage.findBy<User>('users', user => user.email === email);
    return users[0];
  }

  async createUser(userData: InsertUser): Promise<User> {
    return this.fileStorage.create<User>('users', userData as User);
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User | undefined> {
    return this.fileStorage.update<User>('users', id, userData);
  }

  // Posts
  async getPosts(limit = 50): Promise<(Post & { users: User })[]> {
    const posts = await this.fileStorage.getAll<Post>('posts');
    const users = await this.fileStorage.getAll<User>('users');
    
    const postsWithUsers = posts
      .map(post => {
        const user = users.find(u => u.id === post.user_id);
        return user ? { ...post, users: user } : null;
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b!.created_at).getTime() - new Date(a!.created_at).getTime())
      .slice(0, limit);

    return postsWithUsers as (Post & { users: User })[];
  }

  async getPostById(id: string): Promise<(Post & { users: User }) | undefined> {
    const post = await this.fileStorage.getById<Post>('posts', id);
    if (!post) return undefined;

    const user = await this.fileStorage.getById<User>('users', post.user_id);
    if (!user) return undefined;

    return { ...post, users: user };
  }

  async createPost(postData: InsertPost): Promise<Post> {
    const post = {
      ...postData,
      likes_count: 0,
      comments_count: 0,
      shares_count: 0
    };
    return this.fileStorage.create<Post>('posts', post as Post);
  }

  async deletePost(id: string): Promise<boolean> {
    return this.fileStorage.delete<Post>('posts', id);
  }

  // Dua Requests
  async getDuaRequests(limit = 50): Promise<(DuaRequest & { users: User })[]> {
    const duaRequests = await this.fileStorage.getAll<DuaRequest>('duaRequests');
    const users = await this.fileStorage.getAll<User>('users');
    
    const duaRequestsWithUsers = duaRequests
      .map(dua => {
        const user = users.find(u => u.id === dua.user_id);
        return user ? { ...dua, users: user } : null;
      })
      .filter(Boolean)
      .sort((a, b) => {
        // Acil olanları önce göster
        if (a!.is_urgent && !b!.is_urgent) return -1;
        if (!a!.is_urgent && b!.is_urgent) return 1;
        return new Date(b!.created_at).getTime() - new Date(a!.created_at).getTime();
      })
      .slice(0, limit);

    return duaRequestsWithUsers as (DuaRequest & { users: User })[];
  }

  async getDuaRequestById(id: string): Promise<(DuaRequest & { users: User }) | undefined> {
    const duaRequest = await this.fileStorage.getById<DuaRequest>('duaRequests', id);
    if (!duaRequest) return undefined;

    const user = await this.fileStorage.getById<User>('users', duaRequest.user_id);
    if (!user) return undefined;

    return { ...duaRequest, users: user };
  }

  async createDuaRequest(duaRequestData: InsertDuaRequest): Promise<DuaRequest> {
    const duaRequest = {
      ...duaRequestData,
      prayers_count: 0,
      comments_count: 0
    };
    return this.fileStorage.create<DuaRequest>('duaRequests', duaRequest as DuaRequest);
  }

  // Comments
  async getCommentsByPostId(postId: string): Promise<(Comment & { users: User })[]> {
    const comments = await this.fileStorage.findBy<Comment>('comments', comment => comment.post_id === postId);
    const users = await this.fileStorage.getAll<User>('users');
    
    const commentsWithUsers = comments
      .map(comment => {
        const user = users.find(u => u.id === comment.user_id);
        return user ? { ...comment, users: user } : null;
      })
      .filter(Boolean)
      .sort((a, b) => new Date(a!.created_at).getTime() - new Date(b!.created_at).getTime());

    return commentsWithUsers as (Comment & { users: User })[];
  }

  async getCommentsByDuaRequestId(duaRequestId: string): Promise<(Comment & { users: User })[]> {
    const comments = await this.fileStorage.findBy<Comment>('comments', comment => comment.dua_request_id === duaRequestId);
    const users = await this.fileStorage.getAll<User>('users');
    
    const commentsWithUsers = comments
      .map(comment => {
        const user = users.find(u => u.id === comment.user_id);
        return user ? { ...comment, users: user } : null;
      })
      .filter(Boolean)
      .sort((a, b) => new Date(a!.created_at).getTime() - new Date(b!.created_at).getTime());

    return commentsWithUsers as (Comment & { users: User })[];
  }

  async createComment(commentData: InsertComment): Promise<Comment> {
    const comment = await this.fileStorage.create<Comment>('comments', commentData as Comment);
    
    // Yorum sayısını güncelle
    if (commentData.post_id) {
      const post = await this.fileStorage.getById<Post>('posts', commentData.post_id);
      if (post) {
        await this.fileStorage.update<Post>('posts', commentData.post_id, {
          comments_count: (post.comments_count || 0) + 1
        });
      }
    }
    
    if (commentData.dua_request_id) {
      const duaRequest = await this.fileStorage.getById<DuaRequest>('duaRequests', commentData.dua_request_id);
      if (duaRequest) {
        await this.fileStorage.update<DuaRequest>('duaRequests', commentData.dua_request_id, {
          comments_count: (duaRequest.comments_count || 0) + 1
        });
      }
    }

    return comment;
  }

  // Likes
  async getUserLike(userId: string, postId?: string, duaRequestId?: string): Promise<Like | undefined> {
    const likes = await this.fileStorage.findBy<Like>('likes', like => 
      like.user_id === userId && 
      (postId ? like.post_id === postId : like.dua_request_id === duaRequestId)
    );
    return likes[0];
  }

  async toggleLike(userId: string, postId?: string, duaRequestId?: string): Promise<{ liked: boolean }> {
    const existingLike = await this.getUserLike(userId, postId, duaRequestId);
    
    if (existingLike) {
      await this.fileStorage.delete<Like>('likes', existingLike.id);
      
      // Beğeni sayısını azalt
      if (postId) {
        const post = await this.fileStorage.getById<Post>('posts', postId);
        if (post) {
          await this.fileStorage.update<Post>('posts', postId, {
            likes_count: Math.max(0, (post.likes_count || 0) - 1)
          });
        }
      }
      
      if (duaRequestId) {
        const duaRequest = await this.fileStorage.getById<DuaRequest>('duaRequests', duaRequestId);
        if (duaRequest) {
          await this.fileStorage.update<DuaRequest>('duaRequests', duaRequestId, {
            prayers_count: Math.max(0, (duaRequest.prayers_count || 0) - 1)
          });
        }
      }
      
      return { liked: false };
    } else {
      await this.fileStorage.create<Like>('likes', {
        user_id: userId,
        post_id: postId || null,
        dua_request_id: duaRequestId || null
      } as Like);
      
      // Beğeni sayısını artır
      if (postId) {
        const post = await this.fileStorage.getById<Post>('posts', postId);
        if (post) {
          await this.fileStorage.update<Post>('posts', postId, {
            likes_count: (post.likes_count || 0) + 1
          });
        }
      }
      
      if (duaRequestId) {
        const duaRequest = await this.fileStorage.getById<DuaRequest>('duaRequests', duaRequestId);
        if (duaRequest) {
          await this.fileStorage.update<DuaRequest>('duaRequests', duaRequestId, {
            prayers_count: (duaRequest.prayers_count || 0) + 1
          });
        }
      }
      
      return { liked: true };
    }
  }

  // Bookmarks
  async getUserBookmark(userId: string, postId?: string, duaRequestId?: string): Promise<Bookmark | undefined> {
    const bookmarks = await this.fileStorage.findBy<Bookmark>('bookmarks', bookmark => 
      bookmark.user_id === userId && 
      (postId ? bookmark.post_id === postId : bookmark.dua_request_id === duaRequestId)
    );
    return bookmarks[0];
  }

  async toggleBookmark(userId: string, postId?: string, duaRequestId?: string): Promise<{ bookmarked: boolean }> {
    const existingBookmark = await this.getUserBookmark(userId, postId, duaRequestId);
    
    if (existingBookmark) {
      await this.fileStorage.delete<Bookmark>('bookmarks', existingBookmark.id);
      return { bookmarked: false };
    } else {
      await this.fileStorage.create<Bookmark>('bookmarks', {
        user_id: userId,
        post_id: postId || null,
        dua_request_id: duaRequestId || null
      } as Bookmark);
      return { bookmarked: true };
    }
  }

  // Communities
  async getCommunities(limit = 50): Promise<(Community & { users: User })[]> {
    const communities = await this.fileStorage.getAll<Community>('communities');
    const users = await this.fileStorage.getAll<User>('users');
    
    const communitiesWithUsers = communities
      .map(community => {
        const user = users.find(u => u.id === community.created_by);
        return user ? { ...community, users: user } : null;
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b!.created_at).getTime() - new Date(a!.created_at).getTime())
      .slice(0, limit);

    return communitiesWithUsers as (Community & { users: User })[];
  }

  async createCommunity(communityData: InsertCommunity): Promise<Community> {
    const community = {
      ...communityData,
      member_count: 1
    };
    return this.fileStorage.create<Community>('communities', community as Community);
  }

  async joinCommunity(communityId: string, userId: string): Promise<CommunityMember> {
    const membership = await this.fileStorage.create<CommunityMember>('communityMembers', {
      community_id: communityId,
      user_id: userId,
      role: 'member'
    } as CommunityMember);

    // Üye sayısını artır
    const community = await this.fileStorage.getById<Community>('communities', communityId);
    if (community) {
      await this.fileStorage.update<Community>('communities', communityId, {
        member_count: (community.member_count || 0) + 1
      });
    }

    return membership;
  }

  // Events
  async getEvents(limit = 50): Promise<(Event & { users: User })[]> {
    const events = await this.fileStorage.getAll<Event>('events');
    const users = await this.fileStorage.getAll<User>('users');
    
    const eventsWithUsers = events
      .map(event => {
        const user = users.find(u => u.id === event.created_by);
        return user ? { ...event, users: user } : null;
      })
      .filter(Boolean)
      .sort((a, b) => new Date(a!.date).getTime() - new Date(b!.date).getTime())
      .slice(0, limit);

    return eventsWithUsers as (Event & { users: User })[];
  }

  async createEvent(eventData: InsertEvent): Promise<Event> {
    const event = {
      ...eventData,
      attendees_count: 0
    };
    return this.fileStorage.create<Event>('events', event as Event);
  }

  async attendEvent(eventId: string, userId: string): Promise<EventAttendee> {
    const attendance = await this.fileStorage.create<EventAttendee>('eventAttendees', {
      event_id: eventId,
      user_id: userId
    } as EventAttendee);

    // Katılımcı sayısını artır
    const event = await this.fileStorage.getById<Event>('events', eventId);
    if (event) {
      await this.fileStorage.update<Event>('events', eventId, {
        attendees_count: (event.attendees_count || 0) + 1
      });
    }

    return attendance;
  }

  // Reports
  async createReport(reportData: InsertReport): Promise<Report> {
    const report = {
      ...reportData,
      status: 'pending' as const
    };
    return this.fileStorage.create<Report>('reports', report as Report);
  }

  async getReports(limit = 50): Promise<(Report & { reporter: User; reportedUser: User; post?: Post; duaRequest?: DuaRequest })[]> {
    const reports = await this.fileStorage.getAll<Report>('reports');
    const users = await this.fileStorage.getAll<User>('users');
    const posts = await this.fileStorage.getAll<Post>('posts');
    const duaRequests = await this.fileStorage.getAll<DuaRequest>('duaRequests');
    
    const reportsWithDetails = reports
      .map(report => {
        const reporter = users.find(u => u.id === report.reporter_id);
        const reportedUser = users.find(u => u.id === report.reported_user_id);
        const post = report.post_id ? posts.find(p => p.id === report.post_id) : undefined;
        const duaRequest = report.dua_request_id ? duaRequests.find(d => d.id === report.dua_request_id) : undefined;
        
        return (reporter && reportedUser) ? {
          ...report,
          reporter,
          reportedUser,
          post,
          duaRequest
        } : null;
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b!.created_at).getTime() - new Date(a!.created_at).getTime())
      .slice(0, limit);

    return reportsWithDetails as (Report & { reporter: User; reportedUser: User; post?: Post; duaRequest?: DuaRequest })[];
  }

  async updateReportStatus(reportId: string, status: string, adminNotes?: string): Promise<Report | undefined> {
    return this.fileStorage.update<Report>('reports', reportId, {
      status: status as any,
      admin_notes: adminNotes
    });
  }

  // User Bans
  async banUser(banData: InsertUserBan): Promise<UserBan> {
    const ban = {
      ...banData,
      is_active: true
    };
    return this.fileStorage.create<UserBan>('userBans', ban as UserBan);
  }

  async getUserBans(userId: string): Promise<UserBan[]> {
    return this.fileStorage.findBy<UserBan>('userBans', ban => 
      ban.user_id === userId && ban.is_active
    );
  }

  async isUserBanned(userId: string): Promise<boolean> {
    const bans = await this.getUserBans(userId);
    return bans.some(ban => 
      ban.ban_type === 'permanent' || 
      (ban.expires_at && new Date(ban.expires_at) > new Date())
    );
  }

  getDatabaseStatus() {
    return {
      fileSystem: {
        status: 'active',
        enabled: true,
        location: DATA_DIR
      },
      type: 'local-file-storage'
    };
  }

  async checkHealth(): Promise<boolean> {
    try {
      await this.fileStorage.getAll<User>('users');
      return true;
    } catch (error) {
      console.error('File storage health check failed:', error);
      return false;
    }
  }
}

export const storage = new LocalFileStorage();