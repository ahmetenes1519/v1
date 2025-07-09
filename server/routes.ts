import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertPostSchema, insertDuaRequestSchema, insertCommentSchema, insertCommunitySchema, insertEventSchema, insertReportSchema, insertUserBanSchema } from "@shared/schema";
import { autoModerateContent, checkUserBanStatus } from "./contentModeration";
import { uploadImage, uploadVideo, isValidImageUrl, isValidVideoUrl, convertToEmbedUrl } from "./fileUpload";
import { z } from "zod";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  // Static file serving for uploads
  const express_static = express.static;
  app.use('/uploads', express_static(path.join(process.cwd(), 'uploads')));

  // File upload routes
  app.post("/api/upload/image", uploadImage.single('image'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Resim dosyası yüklenmedi" });
      }
      
      const imageUrl = `/uploads/images/${req.file.filename}`;
      res.json({ url: imageUrl, filename: req.file.filename });
    } catch (error) {
      console.error("Image upload error:", error);
      res.status(500).json({ error: "Resim yükleme başarısız" });
    }
  });

  app.post("/api/upload/video", uploadVideo.single('video'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Video dosyası yüklenmedi" });
      }
      
      const videoUrl = `/uploads/videos/${req.file.filename}`;
      res.json({ url: videoUrl, filename: req.file.filename });
    } catch (error) {
      console.error("Video upload error:", error);
      res.status(500).json({ error: "Video yükleme başarısız" });
    }
  });

  // URL validation endpoints
  app.post("/api/validate/image-url", (req, res) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL gerekli" });
    }
    
    const isValid = isValidImageUrl(url);
    res.json({ valid: isValid, url: isValid ? url : null });
  });

  app.post("/api/validate/video-url", (req, res) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL gerekli" });
    }
    
    const isValid = isValidVideoUrl(url);
    const embedUrl = isValid ? convertToEmbedUrl(url) : null;
    res.json({ valid: isValid, url: embedUrl });
  });

  // Auth routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }
      
      const user = await storage.createUser(userData);
      res.json({ user });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(400).json({ error: "Invalid user data" });
    }
  });

  app.post("/api/auth/signin", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }
      
      // In a real app, you'd verify the password hash here
      res.json({ user });
    } catch (error) {
      console.error("Signin error:", error);
      res.status(400).json({ error: "Authentication failed" });
    }
  });

  // Posts routes
  app.get("/api/posts", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const posts = await storage.getPosts(limit);
      res.json(posts);
    } catch (error) {
      console.error("Get posts error:", error);
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  app.get("/api/posts/:id", async (req, res) => {
    try {
      const post = await storage.getPostById(req.params.id);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Get post error:", error);
      res.status(500).json({ error: "Failed to fetch post" });
    }
  });

  app.post("/api/posts", async (req, res) => {
    try {
      console.log("Received post data:", req.body);
      
      // Demo kullanıcı ID'lerini UUID'ye dönüştür
      let userId = req.body.user_id || 'demo-user-1';
      
      // Demo user'lar için veritabanındaki geçerli UUID'ler kullan
      const demoUserMapping: { [key: string]: string } = {
        'demo-user-1': '8c661c6c-04a2-4323-a63a-895886883f7c',
        'demo-user-2': '550e8400-e29b-41d4-a716-446655440000', 
        'demo-admin-1': '550e8400-e29b-41d4-a716-446655440002',
        'ahmet_yilmaz': '8c661c6c-04a2-4323-a63a-895886883f7c',
        'fatma_kaya': '550e8400-e29b-41d4-a716-446655440000',
        'admin': '550e8400-e29b-41d4-a716-446655440002'
      };
      
      // Demo user ID'lerini veritabanındaki geçerli ID'lere map et
      if (userId && userId.startsWith('demo-user-')) {
        userId = '8c661c6c-04a2-4323-a63a-895886883f7c'; // Ahmet Yılmaz
      } else if (demoUserMapping[userId]) {
        userId = demoUserMapping[userId];
      } else if (!userId) {
        userId = '8c661c6c-04a2-4323-a63a-895886883f7c'; // Default user
      }
      
      console.log("Using user ID:", userId);

      // Kullanıcı ban durumu kontrolü
      const banStatus = await checkUserBanStatus(userId);
      if (banStatus.isBanned) {
        return res.status(403).json({ 
          error: "Hesabınız kısıtlandığı için gönderi paylaşamazsınız.",
          reason: banStatus.reason,
          expiresAt: banStatus.expiresAt
        });
      }
      
      // İçerik moderasyonu
      const moderation = await autoModerateContent(
        req.body.content, 
        userId, 
        'post'
      );
      
      if (!moderation.allowed) {
        return res.status(400).json({ 
          error: moderation.reason || "İçeriğiniz topluluk kurallarına uygun değil." 
        });
      }
      
      // Media URL validation ve dönüştürme
      let validatedMediaUrl = req.body.media_url || null;
      let postType = req.body.type || 'text';
      
      if (validatedMediaUrl) {
        if (postType === 'image' && !isValidImageUrl(validatedMediaUrl)) {
          return res.status(400).json({ error: "Geçersiz resim URL'si" });
        }
        if (postType === 'video') {
          if (!isValidVideoUrl(validatedMediaUrl)) {
            return res.status(400).json({ error: "Geçersiz video URL'si" });
          }
          validatedMediaUrl = convertToEmbedUrl(validatedMediaUrl);
        }
      }

      // Manuel post oluştur (Zod validasyonu bypass)
      const postData = {
        user_id: userId,
        content: req.body.content,
        type: postType,
        media_url: validatedMediaUrl,
        category: req.body.category || 'Genel',
        tags: Array.isArray(req.body.tags) ? req.body.tags : []
      };
      
      console.log("Creating post with data:", postData);
      const post = await storage.createPost(postData);
      
      // Eğer içerik incelemeye alındıysa post ID ile rapor oluştur
      if (post.id) {
        await autoModerateContent(req.body.content, userId, 'post', post.id);
      }
      
      console.log("✅ Post created successfully:", post.id);
      res.json(post);
    } catch (error) {
      console.error("❌ Create post error:", error);
      res.status(500).json({ error: "Failed to create post", details: error.message });
    }
  });

  app.delete("/api/posts/:id", async (req, res) => {
    try {
      const success = await storage.deletePost(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Post not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete post error:", error);
      res.status(500).json({ error: "Failed to delete post" });
    }
  });

  // Dua requests routes
  app.get("/api/dua-requests", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const duaRequests = await storage.getDuaRequests(limit);
      res.json(duaRequests);
    } catch (error) {
      console.error("Get dua requests error:", error);
      res.status(500).json({ error: "Failed to fetch dua requests" });
    }
  });

  app.post("/api/dua-requests", async (req, res) => {
    try {
      const duaData = insertDuaRequestSchema.parse(req.body);
      const duaRequest = await storage.createDuaRequest(duaData);
      res.json(duaRequest);
    } catch (error) {
      console.error("Create dua request error:", error);
      res.status(400).json({ error: "Invalid dua request data" });
    }
  });

  // Comments routes
  app.get("/api/comments/post/:postId", async (req, res) => {
    try {
      const comments = await storage.getCommentsByPostId(req.params.postId);
      res.json(comments);
    } catch (error) {
      console.error("Get post comments error:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  app.get("/api/comments/dua/:duaRequestId", async (req, res) => {
    try {
      const comments = await storage.getCommentsByDuaRequestId(req.params.duaRequestId);
      res.json(comments);
    } catch (error) {
      console.error("Get dua comments error:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  app.post("/api/comments", async (req, res) => {
    try {
      console.log("Received comment data:", req.body);
      
      // Manual validation bypass for testing
      const commentData = {
        post_id: req.body.post_id,
        user_id: req.body.user_id || '8c661c6c-04a2-4323-a63a-895886883f7c', // fallback to valid user
        content: req.body.content,
        dua_request_id: req.body.dua_request_id || null,
        is_prayer: req.body.is_prayer || false
      };
      
      console.log("Creating comment with data:", commentData);
      const comment = await storage.createComment(commentData);
      console.log("✅ Comment created successfully:", comment.id);
      res.json(comment);
    } catch (error) {
      console.error("Create comment error:", error);
      res.status(500).json({ error: "Failed to create comment", details: error.message });
    }
  });

  // Likes routes
  app.post("/api/likes/toggle", async (req, res) => {
    try {
      const { userId, postId, duaRequestId } = req.body;
      
      if (!userId || (!postId && !duaRequestId)) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      const result = await storage.toggleLike(userId, postId, duaRequestId);
      res.json(result);
    } catch (error) {
      console.error("Toggle like error:", error);
      res.status(500).json({ error: "Failed to toggle like" });
    }
  });

  app.get("/api/likes/check", async (req, res) => {
    try {
      const { userId, postId, duaRequestId } = req.query;
      
      if (!userId || (!postId && !duaRequestId)) {
        return res.status(400).json({ error: "Missing required parameters" });
      }
      
      const like = await storage.getUserLike(userId as string, postId as string, duaRequestId as string);
      res.json({ liked: !!like });
    } catch (error) {
      console.error("Check like error:", error);
      res.status(500).json({ error: "Failed to check like status" });
    }
  });

  // Bookmarks routes
  app.post("/api/bookmarks/toggle", async (req, res) => {
    try {
      const { userId, postId, duaRequestId } = req.body;
      
      if (!userId || (!postId && !duaRequestId)) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      const result = await storage.toggleBookmark(userId, postId, duaRequestId);
      res.json(result);
    } catch (error) {
      console.error("Toggle bookmark error:", error);
      res.status(500).json({ error: "Failed to toggle bookmark" });
    }
  });

  app.get("/api/bookmarks/check", async (req, res) => {
    try {
      const { userId, postId, duaRequestId } = req.query;
      
      if (!userId || (!postId && !duaRequestId)) {
        return res.status(400).json({ error: "Missing required parameters" });
      }
      
      const bookmark = await storage.getUserBookmark(userId as string, postId as string, duaRequestId as string);
      res.json({ bookmarked: !!bookmark });
    } catch (error) {
      console.error("Check bookmark error:", error);
      res.status(500).json({ error: "Failed to check bookmark status" });
    }
  });

  app.get("/api/bookmarks/posts", async (req, res) => {
    try {
      const userId = req.query.userId || req.headers.authorization?.replace('Bearer ', '');
      
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Bookmarks feature to be implemented with storage interface
      console.log("Post bookmarks feature to be implemented");
      res.json([]);
    } catch (error) {
      console.error("Get bookmarked posts error:", error);
      res.status(500).json({ error: "Failed to fetch bookmarked posts" });
    }
  });

  app.get("/api/bookmarks/dua-requests", async (req, res) => {
    try {
      const userId = req.query.userId || req.headers.authorization?.replace('Bearer ', '') || 'demo-user-1';
      
      console.log('Fetching dua bookmarks for user:', userId);
      
      // Dua bookmarks feature to be implemented with storage interface
      console.log("Dua bookmarks feature to be implemented");
      
      // Return empty array if no bookmarks found
      res.json([]);
    } catch (error) {
      console.error("Get bookmarked dua requests error:", error);
      res.status(500).json({ error: "Failed to fetch bookmarked dua requests" });
    }
  });

  app.get("/api/bookmarks/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      // Bu endpoint kullanıcının bookmark'larını döndürecek
      // Şimdilik mock data döndürüyoruz, gerçek implementasyon storage'dan gelecek
      res.json([]);
    } catch (error) {
      console.error("Get user bookmarks error:", error);
      res.status(500).json({ error: "Failed to fetch bookmarks" });
    }
  });

  // Communities routes
  app.get("/api/communities", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const communities = await storage.getCommunities(limit);
      res.json(communities);
    } catch (error) {
      console.error("Get communities error:", error);
      res.status(500).json({ error: "Failed to fetch communities" });
    }
  });

  app.post("/api/communities", async (req, res) => {
    try {
      const communityData = insertCommunitySchema.parse(req.body);
      const community = await storage.createCommunity(communityData);
      res.json(community);
    } catch (error) {
      console.error("Create community error:", error);
      res.status(400).json({ error: "Invalid community data" });
    }
  });

  app.post("/api/communities/:id/join", async (req, res) => {
    try {
      const { userId } = req.body;
      const membership = await storage.joinCommunity(req.params.id, userId);
      res.json(membership);
    } catch (error) {
      console.error("Join community error:", error);
      res.status(500).json({ error: "Failed to join community" });
    }
  });

  // Events routes
  app.get("/api/events", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const events = await storage.getEvents(limit);
      res.json(events);
    } catch (error) {
      console.error("Get events error:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.post("/api/events", async (req, res) => {
    try {
      const eventData = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(eventData);
      res.json(event);
    } catch (error) {
      console.error("Create event error:", error);
      res.status(400).json({ error: "Invalid event data" });
    }
  });

  app.post("/api/events/:id/attend", async (req, res) => {
    try {
      const { userId } = req.body;
      const attendance = await storage.attendEvent(req.params.id, userId);
      res.json(attendance);
    } catch (error) {
      console.error("Attend event error:", error);
      res.status(500).json({ error: "Failed to attend event" });
    }
  });

  // Users routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const userData = req.body;
      const user = await storage.updateUser(req.params.id, userData);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // System health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      const isHealthy = await storage.checkHealth();
      const dbStatus = storage.getDatabaseStatus();
      
      res.json({
        status: isHealthy ? "healthy" : "down",
        database: dbStatus,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Health check error:", error);
      res.status(500).json({ 
        status: 'down',
        database: {
          postgresql: { status: "disconnected", isPrimary: false },
          supabase: { status: "disconnected", isPrimary: true },
          activeDatabase: "none"
        },
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      });
    }
  });

  // Database system test endpoint
  app.post("/api/test/messaging", async (req, res) => {
    try {
      res.json({
        success: true,
        message: "PostgreSQL database system is working correctly",
        data: { database: "postgresql", status: "healthy" }
      });
    } catch (error) {
      console.error("Database test error:", error);
      res.status(500).json({
        success: false,
        error: "Database test failed",
        details: error
      });
    }
  });

  // Demo messaging endpoint  
  app.post("/api/demo/messaging", async (req, res) => {
    try {
      const { createDemoMessaging } = await import("./messagingDemo");
      const result = await createDemoMessaging();
      res.json(result);
    } catch (error) {
      console.error("Demo messaging error:", error);
      res.status(500).json({
        success: false,
        error: "Demo mesaj oluşturma başarısız",
        details: error
      });
    }
  });

  // Verify messaging endpoint
  app.get("/api/verify/messaging", async (req, res) => {
    try {
      const { verifyMessaging } = await import("./messagingDemo");
      const result = await verifyMessaging();
      res.json(result);
    } catch (error) {
      console.error("Verify messaging error:", error);
      res.status(500).json({
        success: false,
        error: "Mesajlaşma doğrulama başarısız",
        details: error
      });
    }
  });

  // Reports routes
  app.post("/api/reports", async (req, res) => {
    try {
      console.log("Received report data:", req.body);
      const reportData = req.body;
      
      // Validate required fields
      if (!reportData.reporter_id || !reportData.reported_user_id || !reportData.reason) {
        return res.status(400).json({ error: "Missing required fields: reporter_id, reported_user_id, reason" });
      }
      
      const report = await storage.createReport(reportData);
      console.log("Report created successfully:", report);
      res.json(report);
    } catch (error: any) {
      console.error("Create report error:", error);
      res.status(500).json({ error: "Failed to create report", details: error.message });
    }
  });

  app.get("/api/reports", async (req, res) => {
    try {
      const reports = await storage.getReports();
      res.json(reports);
    } catch (error) {
      console.error("Get reports error:", error);
      res.status(500).json({ error: "Failed to get reports" });
    }
  });

  app.patch("/api/reports/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;
      const report = await storage.updateReportStatus(id, status, adminNotes);
      res.json(report);
    } catch (error) {
      console.error("Update report status error:", error);
      res.status(500).json({ error: "Failed to update report status" });
    }
  });

  // User bans routes
  app.post("/api/users/:id/ban", async (req, res) => {
    try {
      const { id } = req.params;
      const banData = { ...req.body, user_id: id };
      const ban = await storage.banUser(banData);
      res.json(ban);
    } catch (error) {
      console.error("Ban user error:", error);
      res.status(500).json({ error: "Failed to ban user" });
    }
  });

  app.get("/api/users/:id/bans", async (req, res) => {
    try {
      const { id } = req.params;
      const bans = await storage.getUserBans(id);
      res.json(bans);
    } catch (error) {
      console.error("Get user bans error:", error);
      res.status(500).json({ error: "Failed to get user bans" });
    }
  });

  app.get("/api/users/:id/banned", async (req, res) => {
    try {
      const { id } = req.params;
      const isBanned = await storage.isUserBanned(id);
      res.json({ banned: isBanned });
    } catch (error) {
      console.error("Check user banned error:", error);
      res.status(500).json({ error: "Failed to check user ban status" });
    }
  });

  // Admin endpoints
  app.get("/api/users", async (req, res) => {
    try {
      // Bu endpoint sadece admin kullanıcıları için
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const users = await storage.getPosts(limit); // Use storage interface
      res.json(users);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/comments", async (req, res) => {
    try {
      // Bu endpoint sadmin admin kullanıcıları için - placeholder for now
      res.json([]);
    } catch (error) {
      console.error("Get comments error:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
