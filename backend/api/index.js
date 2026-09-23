import mongoose from "mongoose";
import app, { allowedOrigins } from "../src/app.js";

/**
 * Serverless entry point for the API.
 *
 * `src/index.js` is the long-running entry: it calls `app.listen()` and attaches a Socket.io server.
 * Neither works in a serverless function, which has no listening socket to bind and is frozen
 * between requests. This wrapper exports the bare Express app `app.js` builds, and connects to
 * MongoDB on demand, reusing the connection while the instance stays warm — opening one per request
 * would exhaust the database's connection limit under any real load.
 *
 * What deploying here costs you: the browser's Socket.io client cannot hold a connection, so live
 * message delivery, typing indicators, online presence and video-call signalling do not work. The
 * REST API is unaffected — registration, login, conversations, history and sending all work, and a
 * recipient sees new messages when the conversation is opened again. For a host that supports
 * sockets, see the Deploying section of the README.
 */

let connecting;

const ensureDatabase = () => {
  // readyState 1 = connected.
  if (mongoose.connection.readyState === 1) return Promise.resolve();

  if (!process.env.DATABASE_URL) {
    return Promise.reject(new Error("DATABASE_URL is not set"));
  }

  // One shared in-flight promise: concurrent cold requests must not each open their own connection.
  if (!connecting) {
    connecting = mongoose.connect(process.env.DATABASE_URL).catch((error) => {
      // Clear it so the next request retries rather than reusing a permanently rejected promise.
      connecting = undefined;
      throw error;
    });
  }
  return connecting;
};

export default async function handler(request, response) {
  // Preflight requests are delegated straight to Express: the CORS middleware answers them, and
  // connecting to the database first would make every preflight fail, which blocks every request
  // the browser sends.
  if (request.method !== "OPTIONS") {
    try {
      await ensureDatabase();
    } catch (error) {
      // This response never passes through Express, so the CORS headers have to be set by hand.
      // Without them the browser reports a CORS failure and hides the actual reason, which turns a
      // one-line misconfiguration into a mystery.
      const origin = request.headers.origin;
      if (origin && allowedOrigins().includes(origin)) {
        response.setHeader("Access-Control-Allow-Origin", origin);
        response.setHeader("Access-Control-Allow-Credentials", "true");
      }
      response.setHeader("Vary", "Origin");

      // 503 rather than 500: the app itself is fine, the database is not reachable.
      response.status(503).json({
        error: {
          status: 503,
          message: `Database unavailable: ${error.message}`,
        },
      });
      return;
    }
  }
  return app(request, response);
}
