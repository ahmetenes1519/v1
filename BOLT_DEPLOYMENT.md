# bolt.new Deployment Guide

## Quick Start for bolt.new

This Islamic social platform is fully optimized for bolt.new deployment. It will automatically detect the environment and run in demo mode when DATABASE_URL is not available.

### 1. Upload Project
- Import this entire project to bolt.new
- All dependencies are pre-configured in package.json

### 2. Environment Detection
The application automatically detects the bolt.new environment and switches to demo mode when PostgreSQL is not available:

```
⚠️ Running in demo mode - no DATABASE_URL found
```

### 3. Demo Mode Features
When running in bolt.new (without DATABASE_URL):
- ✅ Full frontend functionality
- ✅ Demo users and posts 
- ✅ Post creation works
- ✅ Admin panel accessible
- ✅ All UI components functional
- ✅ Islamic themes and features
- ✅ Content moderation system

### 4. Demo Credentials
In bolt.new demo mode, you can access:

**Regular User:**
- ID: `8c661c6c-04a2-4323-a63a-895886883f7c`
- Name: Demo User
- Email: demo@bolt.new

**Admin User:**
- ID: `550e8400-e29b-41d4-a716-446655440002`
- Name: Admin User  
- Email: admin@bolt.new
- Role: admin (can access /admin panel)

### 5. Available Features in Demo Mode
- ✅ Create and view posts
- ✅ Islamic prayer request system
- ✅ User authentication simulation
- ✅ Admin panel with user management
- ✅ Content moderation tools
- ✅ Dark/Light/Islamic themes
- ✅ Responsive mobile design
- ✅ Turkish language interface

### 6. API Endpoints Working
All API endpoints function in demo mode:
- `GET /api/posts` - Returns demo posts
- `POST /api/posts` - Creates new demo posts  
- `GET /api/health` - Shows system status
- `GET /api/users` - Admin user management
- `/admin` - Full admin dashboard

### 7. Starting the Application
bolt.new will automatically run:
```bash
npm run dev
```

### 8. Production Database Setup
For production deployment with real data:
1. Set `DATABASE_URL` environment variable
2. Application automatically switches to PostgreSQL mode
3. Run `npm run db:push` to create database schema

### 9. Architecture Benefits
- **Zero Configuration**: Works immediately in bolt.new
- **Graceful Degradation**: Falls back to demo mode automatically
- **Full Feature Demo**: All functionality testable without database
- **Production Ready**: Easy upgrade to real database
- **Islamic Values**: Content moderation and community features

### 10. File Structure
```
├── client/           # React frontend
├── server/           # Node.js backend  
├── shared/           # Database schema
├── bolt.json         # bolt.new configuration
├── bolt.config.js    # Additional bolt.new settings
└── stackblitz.rc     # Runtime configuration
```

## Demo vs Production Mode

| Feature | Demo Mode (bolt.new) | Production Mode |
|---------|---------------------|-----------------|
| Database | In-memory demo data | PostgreSQL |
| Users | 2 demo users | Full user registration |
| Posts | Demo posts + new ones | Persistent posts |
| Admin Panel | ✅ Functional | ✅ Full featured |
| Authentication | ✅ Simulated | ✅ Real sessions |
| Performance | ✅ Fast | ✅ Scalable |

## Ready to Deploy!

Simply upload this project to bolt.new and it will run immediately with full functionality in demo mode. Perfect for showcasing the Islamic social platform features!