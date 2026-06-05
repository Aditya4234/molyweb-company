import cors from "cors";

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000,http://localhost:5000")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow all origins in development, otherwise check allowedOrigins
    if (process.env.NODE_ENV !== "production") {
      callback(null, true);
    } else if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  credentials: true,
};

export default cors(corsOptions);
