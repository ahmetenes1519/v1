import { db, hasDatabaseUrl } from "./db-netlify";
import { users, posts, duaRequests, likes, comments, bookmarks, communities, communityMembers, events, eventAttendees, reports, userBans } from "@shared/schema";
import type { User, InsertUser, Post, InsertPost, DuaRequest, InsertDuaRequest, Comment, InsertComment, Community, InsertCommunity, Event, InsertEvent, Like, Bookmark, CommunityMember, EventAttendee, Report, InsertReport, UserBan, InsertUserBan } from "@shared/schema";
import { eq, desc, and, sql, or, gt } from "drizzle-orm";

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

export class NetlifyPostgreSQLStorage implements IStorage {
  private isDemoMode = !hasDatabaseUrl;

  // Demo data for when PostgreSQL is not available
  private demoUsers = [
    {
      id: '8c661c6c-04a2-4323-a63a-895886883f7c',
      email: 'demo@netlify.app',
      name: 'Demo User',
      username: 'demo_user',
      avatar_url: null,
      bio: 'Netlify demo user',
      location: 'İstanbul',
      website: null,
      verified: true,
      role: 'user' as const,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      email: 'admin@netlify.app',
      name: 'Admin User',
      username: 'admin',
      avatar_url: null,
      bio: 'Netlify demo admin',
      location: 'İstanbul',
      website: null,
      verified: true,
      role: 'admin' as const,
      created_at: new Date(),
      updated_at: new Date()
    }
  ];

  private demoPosts: any[] = [
    {
      id: 'demo-post-1',
      user_id: '8c661c6c-04a2-4323-a63a-895886883f7c',
      content: 'Netlify üzerinde çalışan İslami sosyal platform! Selamün aleyküm kardeşlerim. 🕌',
      type: 'text',
      media_url: null,
      category: 'Selamlaşma',
      tags: ['netlify', 'demo', 'selam'],
      likes_count: 15,
      comments_count: 3,
      shares_count: 2,
      created_at: new Date(Date.now() - 3600000),
      updated_at: new Date(Date.now() - 3600000),
      users: this.demoUsers[0]
    },
    {
      id: 'demo-post-2',
      user_id: '550e8400-e29b-41d4-a716-446655440002',
      content: 'Platform yöneticisi olarak herkesi İslami değerlerle donatılmış bu güzel platforma davet ediyorum. 🤲',
      type: 'text',
      media_url: null,
      category: 'Duyuru',
      tags: ['duyuru', 'hoşgeldin', 'platform'],
      likes_count: 28,
      comments_count: 7,
      shares_count: 5,
      created_at: new Date(Date.now() - 7200000),
      updated_at: new Date(Date.now() - 7200000),
      users: this.demoUsers[1]
    }
  ];

  // Users
  async getUser(id: string): Promise<User | undefined> {
    if (this.isDemoMode) {
      return this.demoUsers.find(user => user.id === id);
    }
    
    try {
      const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Database error in getUser:', error);
      return this.demoUsers.find(user => user.id === id);
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (this.isDemoMode) {
      return this.demoUsers.find(user => user.username === username);
    }
    
    try {
      const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Database error in getUserByUsername:', error);
      return this.demoUsers.find(user => user.username === username);
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (this.isDemoMode) {
      return this.demoUsers.find(user => user.email === email);
    }
    
    try {
      const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Database error in getUserByEmail:', error);
      return this.demoUsers.find(user => user.email === email);
    }
  }

  async createUser(userData: InsertUser): Promise<User> {
    if (this.isDemoMode) {
      const user = {
        id: 'demo-user-' + Date.now(),
        ...userData,
        created_at: new Date(),
        updated_at: new Date()
      };
      this.demoUsers.push(user as any);
      return user as any;
    }
    
    try {
      const result = await db.insert(users).values(userData as any).returning();
      return result[0];
    } catch (error) {
      console.error('Database error in createUser:', error);
      throw error;
    }
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User | undefined> {
    if (this.isDemoMode) {
      const userIndex = this.demoUsers.findIndex(user => user.id === id);
      if (userIndex !== -1) {
        this.demoUsers[userIndex] = { ...this.demoUsers[userIndex], ...userData, updated_at: new Date() };
        return this.demoUsers[userIndex] as any;
      }
      return undefined;
    }
    
    try {
      const result = await db.update(users).set(userData as any).where(eq(users.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error('Database error in updateUser:', error);
      throw error;
    }
  }

  // Posts
  async getPosts(limit = 50): Promise<(Post & { users: User })[]> {
    if (this.isDemoMode) {
      return this.demoPosts.slice(0, limit);
    }
    
    try {
      const result = await db
        .select()
        .from(posts)
        .leftJoin(users, eq(posts.user_id, users.id))
        .orderBy(desc(posts.created_at))
        .limit(limit);
      
      return result.map(row => ({
        ...row.posts,
        users: row.users!
      }));
    } catch (error) {
      console.error('Database error in getPosts:', error);
      return this.demoPosts.slice(0, limit);
    }
  }

  async getPostById(id: string): Promise<(Post & { users: User }) | undefined> {
    if (this.isDemoMode) {
      return this.demoPosts.find(post => post.id === id);
    }
    
    try {
      const result = await db
        .select()
        .from(posts)
        .leftJoin(users, eq(posts.user_id, users.id))
        .where(eq(posts.id, id))
        .limit(1);
      
      if (result.length === 0) return undefined;
      
      return {
        ...result[0].posts,
        users: result[0].users!
      };
    } catch (error) {
      console.error('Database error in getPostById:', error);
      return this.demoPosts.find(post => post.id === id);
    }
  }

  async createPost(postData: InsertPost): Promise<Post> {
    if (this.isDemoMode) {
      const post = {
        id: 'demo-post-' + Date.now(),
        ...postData,
        likes_count: 0,
        comments_count: 0,
        shares_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      };
      this.demoPosts.unshift({
        ...post,
        users: this.demoUsers.find(u => u.id === postData.user_id) || this.demoUsers[0]
      });
      return post as any;
    }
    
    try {
      const result = await db.insert(posts).values(postData as any).returning();
      return result[0];
    } catch (error) {
      console.error('Database error in createPost:', error);
      throw error;
    }
  }

  async deletePost(id: string): Promise<boolean> {
    if (this.isDemoMode) {
      const index = this.demoPosts.findIndex(post => post.id === id);
      if (index !== -1) {
        this.demoPosts.splice(index, 1);
        return true;
      }
      return false;
    }
    
    try {
      const result = await db.delete(posts).where(eq(posts.id, id));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Database error in deletePost:', error);
      return false;
    }
  }

  // Dua Requests
  async getDuaRequests(limit = 50): Promise<(DuaRequest & { users: User })[]> {
    if (this.isDemoMode) {
      return []; // Empty for demo
    }
    
    try {
      const result = await db
        .select()
        .from(duaRequests)
        .leftJoin(users, eq(duaRequests.user_id, users.id))
        .orderBy(desc(duaRequests.created_at))
        .limit(limit);
      
      return result.map(row => ({
        ...row.dua_requests,
        users: row.users!
      }));
    } catch (error) {
      console.error('Database error in getDuaRequests:', error);
      return [];
    }
  }

  async getDuaRequestById(id: string): Promise<(DuaRequest & { users: User }) | undefined> {
    if (this.isDemoMode) {
      return undefined;
    }
    
    try {
      const result = await db
        .select()
        .from(duaRequests)
        .leftJoin(users, eq(duaRequests.user_id, users.id))
        .where(eq(duaRequests.id, id))
        .limit(1);
      
      if (result.length === 0) return undefined;
      
      return {
        ...result[0].dua_requests,
        users: result[0].users!
      };
    } catch (error) {
      console.error('Database error in getDuaRequestById:', error);
      return undefined;
    }
  }

  async createDuaRequest(duaRequest: InsertDuaRequest): Promise<DuaRequest> {
    if (this.isDemoMode) {
      const dua = {
        id: 'demo-dua-' + Date.now(),
        ...duaRequest,
        prayers_count: 0,
        comments_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      };
      return dua as any;
    }
    
    try {
      const result = await db.insert(duaRequests).values(duaRequest).returning();
      return result[0];
    } catch (error) {
      console.error('Database error in createDuaRequest:', error);
      throw error;
    }
  }

  // Comments
  async getCommentsByPostId(postId: string): Promise<(Comment & { users: User })[]> {
    if (this.isDemoMode) {
      return [];
    }
    
    try {
      const result = await db
        .select()
        .from(comments)
        .leftJoin(users, eq(comments.user_id, users.id))
        .where(eq(comments.post_id, postId))
        .orderBy(desc(comments.created_at));
      
      return result.map(row => ({
        ...row.comments,
        users: row.users!
      }));
    } catch (error) {
      console.error('Database error in getCommentsByPostId:', error);
      return [];
    }
  }

  async getCommentsByDuaRequestId(duaRequestId: string): Promise<(Comment & { users: User })[]> {
    if (this.isDemoMode) {
      return [];
    }
    
    try {
      const result = await db
        .select()
        .from(comments)
        .leftJoin(users, eq(comments.user_id, users.id))
        .where(eq(comments.dua_request_id, duaRequestId))
        .orderBy(desc(comments.created_at));
      
      return result.map(row => ({
        ...row.comments,
        users: row.users!
      }));
    } catch (error) {
      console.error('Database error in getCommentsByDuaRequestId:', error);
      return [];
    }
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    if (this.isDemoMode) {
      const newComment = {
        id: 'demo-comment-' + Date.now(),
        ...comment,
        created_at: new Date(),
        updated_at: new Date()
      };
      return newComment as any;
    }
    
    try {
      const result = await db.insert(comments).values(comment).returning();
      return result[0];
    } catch (error) {
      console.error('Database error in createComment:', error);
      throw error;
    }
  }

  // Likes
  async getUserLike(userId: string, postId?: string, duaRequestId?: string): Promise<Like | undefined> {
    if (this.isDemoMode) {
      return undefined;
    }
    
    try {
      const conditions = [eq(likes.user_id, userId)];
      if (postId) conditions.push(eq(likes.post_id, postId));
      if (duaRequestId) conditions.push(eq(likes.dua_request_id, duaRequestId));
      
      const result = await db.select().from(likes).where(and(...conditions)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Database error in getUserLike:', error);
      return undefined;
    }
  }

  async toggleLike(userId: string, postId?: string, duaRequestId?: string): Promise<{ liked: boolean }> {
    if (this.isDemoMode) {
      return { liked: true };
    }
    
    try {
      const existingLike = await this.getUserLike(userId, postId, duaRequestId);
      
      if (existingLike) {
        await db.delete(likes).where(eq(likes.id, existingLike.id));
        return { liked: false };
      } else {
        await db.insert(likes).values({
          user_id: userId,
          post_id: postId || null,
          dua_request_id: duaRequestId || null
        });
        return { liked: true };
      }
    } catch (error) {
      console.error('Database error in toggleLike:', error);
      return { liked: false };
    }
  }

  // Bookmarks
  async getUserBookmark(userId: string, postId?: string, duaRequestId?: string): Promise<Bookmark | undefined> {
    if (this.isDemoMode) {
      return undefined;
    }
    
    try {
      const conditions = [eq(bookmarks.user_id, userId)];
      if (postId) conditions.push(eq(bookmarks.post_id, postId));
      if (duaRequestId) conditions.push(eq(bookmarks.dua_request_id, duaRequestId));
      
      const result = await db.select().from(bookmarks).where(and(...conditions)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Database error in getUserBookmark:', error);
      return undefined;
    }
  }

  async toggleBookmark(userId: string, postId?: string, duaRequestId?: string): Promise<{ bookmarked: boolean }> {
    if (this.isDemoMode) {
      return { bookmarked: true };
    }
    
    try {
      const existingBookmark = await this.getUserBookmark(userId, postId, duaRequestId);
      
      if (existingBookmark) {
        await db.delete(bookmarks).where(eq(bookmarks.id, existingBookmark.id));
        return { bookmarked: false };
      } else {
        await db.insert(bookmarks).values({
          user_id: userId,
          post_id: postId || null,
          dua_request_id: duaRequestId || null
        });
        return { bookmarked: true };
      }
    } catch (error) {
      console.error('Database error in toggleBookmark:', error);
      return { bookmarked: false };
    }
  }

  // Communities
  async getCommunities(limit = 50): Promise<(Community & { users: User })[]> {
    if (this.isDemoMode) {
      return [];
    }
    
    try {
      const result = await db
        .select()
        .from(communities)
        .leftJoin(users, eq(communities.created_by, users.id))
        .orderBy(desc(communities.created_at))
        .limit(limit);
      
      return result.map(row => ({
        ...row.communities,
        users: row.users!
      }));
    } catch (error) {
      console.error('Database error in getCommunities:', error);
      return [];
    }
  }

  async createCommunity(community: InsertCommunity): Promise<Community> {
    if (this.isDemoMode) {
      const newCommunity = {
        id: 'demo-community-' + Date.now(),
        ...community,
        member_count: 1,
        created_at: new Date(),
        updated_at: new Date()
      };
      return newCommunity as any;
    }
    
    try {
      const result = await db.insert(communities).values(community).returning();
      return result[0];
    } catch (error) {
      console.error('Database error in createCommunity:', error);
      throw error;
    }
  }

  async joinCommunity(communityId: string, userId: string): Promise<CommunityMember> {
    if (this.isDemoMode) {
      return {
        id: 'demo-member-' + Date.now(),
        community_id: communityId,
        user_id: userId,
        role: 'member',
        joined_at: new Date()
      } as any;
    }
    
    try {
      const result = await db.insert(communityMembers).values({
        community_id: communityId,
        user_id: userId,
        role: 'member'
      }).returning();
      return result[0];
    } catch (error) {
      console.error('Database error in joinCommunity:', error);
      throw error;
    }
  }

  // Events
  async getEvents(limit = 50): Promise<(Event & { users: User })[]> {
    if (this.isDemoMode) {
      return [];
    }
    
    try {
      const result = await db
        .select()
        .from(events)
        .leftJoin(users, eq(events.created_by, users.id))
        .orderBy(desc(events.created_at))
        .limit(limit);
      
      return result.map(row => ({
        ...row.events,
        users: row.users!
      }));
    } catch (error) {
      console.error('Database error in getEvents:', error);
      return [];
    }
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    if (this.isDemoMode) {
      const newEvent = {
        id: 'demo-event-' + Date.now(),
        ...event,
        attendees_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      };
      return newEvent as any;
    }
    
    try {
      const result = await db.insert(events).values(event).returning();
      return result[0];
    } catch (error) {
      console.error('Database error in createEvent:', error);
      throw error;
    }
  }

  async attendEvent(eventId: string, userId: string): Promise<EventAttendee> {
    if (this.isDemoMode) {
      return {
        id: 'demo-attendee-' + Date.now(),
        event_id: eventId,
        user_id: userId,
        registered_at: new Date()
      } as any;
    }
    
    try {
      const result = await db.insert(eventAttendees).values({
        event_id: eventId,
        user_id: userId
      }).returning();
      return result[0];
    } catch (error) {
      console.error('Database error in attendEvent:', error);
      throw error;
    }
  }

  // Reports
  async createReport(report: InsertReport): Promise<Report> {
    if (this.isDemoMode) {
      return {
        id: 'demo-report-' + Date.now(),
        ...report,
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date()
      } as any;
    }
    
    try {
      const [newReport] = await db.insert(reports).values(report as any).returning();
      return newReport;
    } catch (error) {
      console.error('Database error in createReport:', error);
      throw error;
    }
  }

  async getReports(limit = 50): Promise<(Report & { reporter: User; reportedUser: User; post?: Post; duaRequest?: DuaRequest })[]> {
    if (this.isDemoMode) {
      return [];
    }
    
    try {
      const allReports = await db
        .select()
        .from(reports)
        .orderBy(desc(reports.created_at))
        .limit(limit);

      const result = [];
      for (const report of allReports) {
        const [reporter] = await db.select().from(users).where(eq(users.id, report.reporter_id));
        const [reportedUser] = await db.select().from(users).where(eq(users.id, report.reported_user_id));
        
        let post = undefined;
        let duaRequest = undefined;
        
        if (report.post_id) {
          const [postResult] = await db.select().from(posts).where(eq(posts.id, report.post_id));
          post = postResult;
        }
        
        if (report.dua_request_id) {
          const [duaResult] = await db.select().from(duaRequests).where(eq(duaRequests.id, report.dua_request_id));
          duaRequest = duaResult;
        }

        result.push({
          ...report,
          reporter,
          reportedUser,
          post,
          duaRequest
        });
      }

      return result;
    } catch (error) {
      console.error('Database error in getReports:', error);
      return [];
    }
  }

  async updateReportStatus(reportId: string, status: string, adminNotes?: string): Promise<Report | undefined> {
    if (this.isDemoMode) {
      return undefined;
    }
    
    try {
      const [updated] = await db
        .update(reports)
        .set({ 
          status: status as any,
          admin_notes: adminNotes,
          updated_at: new Date()
        })
        .where(eq(reports.id, reportId))
        .returning();
      return updated;
    } catch (error) {
      console.error('Database error in updateReportStatus:', error);
      return undefined;
    }
  }

  // User Bans
  async banUser(ban: InsertUserBan): Promise<UserBan> {
    if (this.isDemoMode) {
      return {
        id: 'demo-ban-' + Date.now(),
        ...ban,
        is_active: true,
        created_at: new Date()
      } as any;
    }
    
    try {
      const [newBan] = await db.insert(userBans).values(ban as any).returning();
      return newBan;
    } catch (error) {
      console.error('Database error in banUser:', error);
      throw error;
    }
  }

  async getUserBans(userId: string): Promise<UserBan[]> {
    if (this.isDemoMode) {
      return [];
    }
    
    try {
      return await db
        .select()
        .from(userBans)
        .where(and(eq(userBans.user_id, userId), eq(userBans.is_active, true)));
    } catch (error) {
      console.error('Database error in getUserBans:', error);
      return [];
    }
  }

  async isUserBanned(userId: string): Promise<boolean> {
    if (this.isDemoMode) {
      return false;
    }
    
    try {
      const activeBans = await db
        .select()
        .from(userBans)
        .where(
          and(
            eq(userBans.user_id, userId),
            eq(userBans.is_active, true),
            or(
              eq(userBans.ban_type, 'permanent'),
              gt(userBans.expires_at, new Date())
            )
          )
        );
      return activeBans.length > 0;
    } catch (error) {
      console.error('Database error in isUserBanned:', error);
      return false;
    }
  }

  getDatabaseStatus() {
    if (this.isDemoMode) {
      return {
        postgresql: {
          status: 'demo-mode',
          enabled: false
        },
        netlify: {
          status: 'active',
          enabled: true
        }
      };
    }
    return {
      postgresql: { 
        status: 'connected', 
        enabled: true,
        provider: 'netlify'
      },
      netlify: {
        status: 'active',
        enabled: true
      }
    };
  }

  async checkHealth(): Promise<boolean> {
    if (this.isDemoMode) {
      return true; // Always healthy in demo mode
    }
    
    try {
      await db.select().from(users).limit(1);
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
}

export const storage = new NetlifyPostgreSQLStorage();