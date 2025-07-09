# İslami Sosyal Platform

Modern Islamic social media platform built with React, Node.js, and PostgreSQL.

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Access the application
http://localhost:5000
```

### bolt.new Deployment

This project is optimized for bolt.new deployment:

1. **Import Project**: Upload or clone this repository to bolt.new
2. **Environment Setup**: Configure environment variables (see .env.example)
3. **Database**: The project will automatically set up PostgreSQL tables
4. **Start**: Run `npm run dev` to start the development server

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript  
- **Database**: PostgreSQL + Drizzle ORM
- **Authentication**: Custom session-based auth
- **Deployment**: bolt.new compatible

## 📱 Features

### Core Features
- ✅ User registration and authentication
- ✅ Post creation and management
- ✅ Islamic prayer request system (Dua)
- ✅ Like and comment system
- ✅ Community management
- ✅ Event organization
- ✅ Bookmark system

### Admin Features
- ✅ Content moderation dashboard
- ✅ User management and ban system
- ✅ Post deletion and content review
- ✅ Report management system
- ✅ Platform analytics

### Technical Features
- ✅ Real-time updates
- ✅ Responsive design
- ✅ Dark/Light theme support
- ✅ Content filtering and moderation
- ✅ Image and video URL sharing
- ✅ Emoji support

## 🛠️ API Endpoints

### Posts
- `GET /api/posts` - List posts
- `POST /api/posts` - Create new post
- `DELETE /api/posts/:id` - Delete post

### Dua Requests
- `GET /api/dua-requests` - List prayer requests
- `POST /api/dua-requests` - Create prayer request

### Communities & Events
- `GET /api/communities` - List communities
- `GET /api/events` - List events

### Admin
- `GET /api/users` - List users (admin only)
- `GET /api/reports` - List reports (admin only)

## 🔧 Development

### Database Setup

```bash
# Push database schema
npm run db:push
```

### Project Structure

```
├── client/           # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── contexts/
├── server/           # Node.js backend
│   ├── index.ts      # Server entry point
│   ├── routes.ts     # API routes
│   ├── storage.ts    # Database operations
│   └── db.ts         # Database connection
├── shared/           # Shared types and schemas
│   └── schema.ts     # Drizzle database schema
└── uploads/          # File uploads directory
```

## 🌐 Environment Variables

Create a `.env` file based on `.env.example`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/islamic_platform
NODE_ENV=development
PORT=5000
```

## 🎯 bolt.new Compatibility

This project is specifically optimized for bolt.new with:

- **Auto-configuration**: Automatic setup and dependency installation
- **Environment handling**: Proper environment variable management
- **Database integration**: PostgreSQL setup and schema migration
- **Production ready**: Optimized build and start scripts
- **Error handling**: Comprehensive error boundaries and logging

## 📚 Islamic Values Integration

The platform incorporates Islamic values through:

- Content moderation with Islamic guidelines
- Prayer request (Dua) system
- Community-focused features
- Respectful communication standards
- Halal content policies

## 🔒 Security Features

- Server-side input validation
- Content moderation system
- User authentication and authorization
- SQL injection prevention
- XSS protection
- Rate limiting

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-first approach
- **Theme Support**: Light, Dark, Islamic, and Ramadan themes
- **Accessibility**: WCAG compliant
- **Performance**: Optimized loading and caching
- **Internationalization**: Turkish language support

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For support and questions, please open an issue in the repository.

---

**Built with ❤️ for the Islamic community**