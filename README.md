# 🌐 Collab Code Editor

A real-time, highly interactive collaborative coding environment designed for teams, interviews, and teaching. Built with a modern tech stack, it features live code synchronization, integrated AI assistance, a collaborative whiteboard, and powerful admin moderation tools.

## ✨ Key Features

- **💻 Real-Time Code Execution:** Write and execute code in multiple languages (JavaScript, Python, Java, C++, C).
- **🤖 Integrated AI Assistant:** Built-in AI chat that reads your code and helps you debug or refactor directly within the editor.
- **🎨 Collaborative Whiteboard:** A shared canvas to brainstorm architectures and draw flowcharts together.
- **💬 Team Chat:** Built-in messaging to communicate with your peers without leaving the environment.
- **🎙️ Voice & Video Calls:** Native WebRTC peer-to-peer video chatting with incoming call notifications and a floating widget.
- **📂 File Management:** Drag & drop local folders directly into the workspace or use the manual upload button to instantly import files.
- **🛡️ Advanced Admin Controls:** 
  - **Room Locking:** Prevent unauthorized users from joining.
  - **Force View Sync:** Snap everyone's screen to the specific file the admin is viewing.
  - **Read-Only Mode:** Freeze the editor for all users while the admin presents.
  - **Elevated Access:** Whitelist specific users to bypass read-only restrictions.
  - **Global Announcements:** Broadcast animated toast notifications to all users.
  - **Chat Moderation:** Mute the team chat and download chat history logs.
  - **Session Management:** End sessions and kick users instantly.

## 🛠️ Tech Stack

- **Frontend:** React, Vite, Framer Motion, Monaco Editor
- **Backend:** Node.js, Express, Socket.io
- **AI Integration:** Google Gemini API
- **Code Execution:** Judge0 API

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repository-url>
   cd collab-code-editor
   ```

2. **Setup the Server:**
   ```bash
   cd server
   npm install
   ```
   *Create a `.env` file in the `/server` directory. See `.env.example` for required keys.*

3. **Configure Environment Variables:**
   
   Create `/server/.env` with the following:
   ```
   PORT=5001
   MONGODB_URI=your_mongodb_connection_string
   RAPIDAPI_KEY=your_judge0_api_key
   FRONTEND_URL=http://localhost:5173
   REDIS_URL=your_upstash_redis_url (optional)
   GEMINI_API_KEY=your_gemini_api_key
   ```
   
   **Required Keys:**
   - `RAPIDAPI_KEY` - Get from [Judge0 API](https://rapidapi.com/judge0-official/api/judge0-ce) for code execution
   - `GEMINI_API_KEY` - Get from [Google AI Studio](https://ai.google.dev/) for AI features
   - `MONGODB_URI` - Optional, for database persistence (runs in-memory if not provided)

4. **Setup the Client:**
   ```bash
   cd ../client
   npm install
   ```

### Running Locally

You need to run both the server and the client simultaneously.

**Terminal 1 (Backend):**
```bash
cd server
npm start
```
*(The server will run on port 5001 by default)*

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```
*(The client will open on port 5173 by default)*

## 👑 Using the Admin Panel
When you create a new room, you are automatically assigned as the **Admin**. 
Look for the **Crown Icon** in the top right corner of the workspace to open the Admin Control Modal and access all moderation tools. You can also grant "Editor" privileges to other users by clicking the **Pen Icon** next to their name in the sidebar.

## 📋 Project Status & Configuration

For a detailed audit of the project configuration, dependencies, and setup requirements, see [PROJECT_AUDIT_REPORT.md](./PROJECT_AUDIT_REPORT.md).

**Quick Checklist Before Running:**
- ✅ Node.js installed
- ✅ All environment variables configured in `/server/.env`
- ✅ Dependencies installed (`npm install` in both `/client` and `/server`)
- ✅ Both server and client running simultaneously

## 🔧 Troubleshooting

### Code Execution Not Working
- **Error:** "Failed to execute code" or no output
- **Solution:** Ensure `RAPIDAPI_KEY` is set in `/server/.env` and your Judge0 API key is valid

### AI Chat Not Responding
- **Error:** "I'm currently unable to process this request"
- **Solution:** Ensure `GEMINI_API_KEY` is set in `/server/.env` and valid

### Real-time Sync Not Working
- **Error:** Changes not syncing between users
- **Solution:** Ensure both users are in the same room and backend is running on `http://localhost:5001`

### Database Persistence Issues
- **Solution:** Set `MONGODB_URI` in `/server/.env` for persistent storage. Without it, data is lost on server restart.

## 📚 Documentation

- **Architecture:** Real-time CRDT synchronization with Yjs, Socket.IO for events
- **Code Execution:** Judge0 API for sandboxed code execution
- **AI Features:** Google Gemini API for intelligent code assistance
- **Whiteboard:** Excalidraw for collaborative drawing
- **Database:** MongoDB + Redis optional caching layer
