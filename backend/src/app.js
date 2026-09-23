import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import cookieParser from "cookie-parser";
import compression from "compression";
import fileUpload from "express-fileupload";
import cors from "cors";
import createHttpError from "http-errors";
import routes from "./routes/index.js";

//dotEnv config
dotenv.config();

//create express app
const app = express();

//morgan
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

//helmet
app.use(helmet());

//parse json request url
app.use(express.json());

//parse json request body
app.use(express.urlencoded({ extended: true }));

//sanitize request data
app.use(mongoSanitize());

//enable cookie parser
app.use(cookieParser());

//gzip compression
app.use(compression());

//file upload
app.use(
  fileUpload({
    useTempFiles: true,
  })
);

//cors
// The allowed origin was hardcoded to the original demo's Vercel URL, so this API could only ever
// answer that one site — any new frontend would be blocked in the browser while the API looked
// perfectly healthy from curl. CLIENT_ENDPOINT is read as a comma-separated list so the production
// frontend, preview deployments and localhost can all be allowed without editing code again.
export const allowedOrigins = () =>
  (process.env.CLIENT_ENDPOINT || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // A missing origin means a same-origin or non-browser client (curl, uptime checks), which is
      // not something a browser can forge, so it is allowed. Everything else must be on the list.
      if (!origin || allowedOrigins().includes(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  })
);

//api v1 routes
app.use("/api/v1", routes);

app.use(async (req, res, next) => {
  next(createHttpError.NotFound("This route does not exist."));
});

//error handling
app.use(async (err, req, res, next) => {
  res.status(err.status || 500);
  res.send({
    error: {
      status: err.status || 500,
      message: err.message,
    },
  });
});

export default app;
