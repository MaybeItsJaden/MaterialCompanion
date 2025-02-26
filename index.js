import express from "express";
import { OpenAI } from "openai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();

// Manually set CORS headers on each request
app.use((req, res, next) => {
  // Allow any origin (for an extension that runs on all sites)
  res.header("Access-Control-Allow-Origin", "*");
  // Allowed HTTP methods
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  // Allowed headers
  res.header("Access-Control-Allow-Headers", "Content-Type, Accept, Origin");
  // How long to cache preflight response
  res.header("Access-Control-Max-Age", "86400");

  // Handle preflight OPTIONS requests
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  next();
});

// Parse JSON bodies
app.use(express.json());

// Initialize OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    details: err.message,
  });
});

// Basic health check endpoint (GET /api)
app.get("/api", (req, res) => {
  console.log("Health check request received");
  console.log("Headers:", req.headers);
  res.json({
    message: "Material Companion API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Main POST endpoint (POST /api)
app.post("/api", async (req, res) => {
  try {
    const { text, images, url } = req.body;

    // Debug logs
    console.log("=== POST /api Request ===");
    console.log("Request body:", {
      textLength: text?.length,
      imagesCount: images?.length,
      url,
    });

    if (!text || !images) {
      throw new Error("Missing required fields: text and images");
    }

    // Build your prompt for OpenAI
    const prompt = `
      Extract product details from the following page content.
      Return a JSON object with these fields: 
      "name", "image", "link", "size", and "contact".
      
      Text: ${text}
      Images: ${images ? images.join(", ") : ""}
    `;

    console.log("Calling OpenAI API...");
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
    });

    if (!aiResponse?.choices?.[0]?.message?.content) {
      throw new Error("Invalid response from OpenAI");
    }

    console.log("OpenAI raw response:", aiResponse.choices[0].message.content);
    const data = JSON.parse(aiResponse.choices[0].message.content);

    // Attach original URL if provided
    data.link = url || "";

    res.json(data);
  } catch (error) {
    console.error("Detailed error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      type: typeof error,
      fullError: JSON.stringify(error, null, 2),
    });

    res.status(500).json({
      error: "Failed to process data",
      details: error.message,
      type: error.name,
      stack: error.stack,
    });
  }
});

// For local development only
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Vercel
export default app;
