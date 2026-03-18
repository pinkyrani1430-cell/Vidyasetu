# VIDYASETU

An AI-powered, offline-first learning workspace that combines personalized education, gamification, and real-time quiz competition.

this is the deployed link - https://vidyasetu-sigma.vercel.app

## Features

- **Quiz Arena**: Real-time 1v1 battles with matchmaking and AI fallback.
- **AI Workspace**: Personalized learning roadmap and coding compiler.
- **Study Timer**: Persistent timer that tracks your focus across the platform.
- **Teacher Dashboard**: Detailed analytics on student performance and weak topics.
- **Multi-language Support**: English, Hindi, Spanish, and French.

## Tech Stack

- **Frontend**: React 19, Tailwind CSS 4, Lucide React, Framer Motion, Recharts.
- **Backend**: Node.js, Express, Socket.IO.
- **Database**: Firebase (Firestore, Auth).
- **AI**: Google Gemini API.

## Getting Started



### Prerequisites

- Node.js (v18+)
- npm

### Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables in `.env` (see `.env.example`).

### Development

Run the development server:
```bash
npm run dev
```
The app will be available at `http://localhost:3000`.

### Build & Deploy

#### Standard Build
```bash
npm run build
```

#### Deployment (Docker)
A `Dockerfile` is provided for easy deployment to platforms like Google Cloud Run.

1. Build the image:
   ```bash
   docker build -t vidyasetu .
   ```
2. Run the container:
   ```bash
   docker run -p 3000:3000 vidyasetu
   ```

## VS Code Recommended Extensions

- **Tailwind CSS IntelliSense**
- **Prettier - Code formatter**
- **ES7+ React/Redux/React-Native snippets**
- **ESLint**

## License

MIT
