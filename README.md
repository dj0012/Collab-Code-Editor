# 🌐 Collaborative Code Editor

A real-time, highly interactive collaborative coding environment designed for teams, interviews, and teaching. Built with a modern tech stack, it features live code synchronization, integrated AI assistance, a collaborative whiteboard, and powerful admin moderation tools.

## ✨ Key Features

- **💻 Real-Time Code Execution:** Write and execute code in multiple languages (JavaScript, Python, Java, C++, C).
- **🤖 Integrated AI Assistant:** Built-in AI chat that reads your code and helps you debug or refactor directly within the editor.
- **🎨 Collaborative Whiteboard:** A shared canvas to brainstorm architectures and draw flowcharts together.
- **💬 Team Chat:** Built-in messaging to communicate with your peers without leaving the environment.
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
   *Create a `.env` file in the `/server` directory and add your API keys (e.g., `GEMINI_API_KEY`, `RAPIDAPI_KEY` for Judge0).*

3. **Setup the Client:**
   ```bash
   cd ../client
   npm install
   ```

### Running Locally

You need to run both the server and the client simultaneously.

**Terminal 1 (Backend):**
```bash
cd server
node index.js
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
