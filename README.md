# Sky Chat

A realtime chat application — one-to-one and group messaging, media sharing, and peer-to-peer video
calls — built with React, Node.js, MongoDB, Socket.io and WebRTC.

## Credits and licensing

Based on [Full-Stack-Whatsapp-Clone](https://github.com/piyushyadav0191/Full-Stack-Whatsapp-Clone)
by piyushyadav0191, which as of this writing carries **no licence file**. That means the original
author retains all rights by default; this repository is kept private for that reason. If you intend
to publish or redistribute it, get the author's permission or add a licence first.

Rebranded and adapted here as Sky Chat.

## Features

- Email registration and login with access/refresh JWTs stored in httpOnly cookies
- One-to-one and group conversations
- Realtime message delivery, typing indicators and online presence over Socket.io
- Image and document sharing, uploaded straight from the browser
- Video calling over WebRTC (peer-to-peer, with `peerjs` / `simple-peer`)
- Chat list filtering, in-chat message search, emoji picker, dark mode

## Structure

```
backend/    Express + MongoDB + Socket.io API
  src/index.js        server entry — connects Mongo, listens, attaches Socket.io
  src/app.js          Express app, middleware, CORS allow-list, routes
  src/SocketServer.js realtime event handlers
  src/routes/         /api/v1/{auth,user,conversation,message}

frontend/   Create React App single-page app
  src/App.js          routing + the Socket.io client connection
  src/features/       Redux Toolkit slices (auth, chat)
  src/utils/upload.js Cloudinary upload helper
```

## Running locally

Requires Node.js and a MongoDB instance (local, or a free Atlas cluster).

```bash
# backend
cd backend
cp .env.example .env      # then fill it in — see the table below
npm install
npm run dev               # http://localhost:5000

# frontend (second terminal)
cd frontend
cp .env.example .env
npm install
npm start                 # http://localhost:3000
```

### Backend environment

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | MongoDB connection string, e.g. `mongodb+srv://…` from Atlas |
| `ACCESS_TOKEN_SECRET` | yes | Long random string |
| `REFRESH_TOKEN_SECRET` | yes | Long random string |
| `CLIENT_ENDPOINT` | yes | Allowed browser origin(s). **Comma-separated** for more than one, e.g. `https://sky-chat.vercel.app,http://localhost:3000`. The API and the Socket.io server both read this list |
| `PORT` | no | Defaults to 8000 |
| `NODE_ENV` | no | Set to `production` on a server to reduce logging |
| `DEFAULT_PICTURE`, `DEFAULT_GROUP_PICTURE`, `DEFAULT_STATUS` | no | Fallbacks for new accounts |

### Frontend environment

| Variable | Required | Notes |
| --- | --- | --- |
| `REACT_APP_API_ENDPOINT` | yes | Backend base **including** the version path, e.g. `https://sky-chat-api.example.com/api/v1`. The Socket.io client derives its origin by stripping `/api/v1` |
| `REACT_APP_CLOUD_NAME`, `REACT_APP_CLOUD_SECRET` | yes for avatars | Cloudinary cloud name and an **unsigned upload preset** for profile pictures |
| `REACT_APP_CLOUD_NAME2`, `REACT_APP_CLOUD_SECRET2` | yes for attachments | Cloudinary cloud name and unsigned preset for images/documents in chats |

Despite the names, the `*_SECRET` values are Cloudinary *unsigned upload preset names*, not API
secrets — they are shipped to the browser by design.

## Deploying

**The frontend deploys anywhere static** — Vercel, Netlify, Cloudflare Pages. `npm run build` and
publish `build/`.

**The backend needs a host that keeps a Node process alive**, because Socket.io holds long-lived
connections: Render, Railway, Fly.io, a VPS, or any container host.

> Vercel Functions are **not** suitable for this backend. Serverless functions are short-lived and
> scale per request, so a socket handshake and the polls that follow it land on different instances.
> Tested against a deployed serverless instance, the client never connects (`xhr post error` →
> `transport error`). REST endpoints keep working, which makes it look healthy while realtime
> silently does nothing.

Deploy order:

1. Provision MongoDB (Atlas free tier is enough) and copy its connection string.
2. Deploy `backend/` to a persistent-process host with the environment variables above.
3. Deploy `frontend/` with `REACT_APP_API_ENDPOINT` pointing at the backend from step 2.
4. Put the frontend's URL into the backend's `CLIENT_ENDPOINT` and restart it, or the browser will
   have its requests blocked by CORS.

## Known gaps

- No test suite.
- Video calls rely on `simple-peer`/`peerjs` signalling over the app's own Socket.io server, so a
  call only works while both browsers are connected to the same backend.
- Uploads depend on Cloudinary; without the keys above, registration with a custom avatar and file
  attachments will fail while text chat works.
