import express from "express";
import { OpenAI } from "openai";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();

// Move CORS middleware to top, before any routes
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    details: err.message,
  });
});

// Basic health check endpoint
app.get("/api", (req, res) => {
  res.json({ message: "Material Companion API is running" });
});

app.post("/api", async (req, res) => {
  try {
    const { text, images, url } = req.body;

    // Debug logs
    console.log("Incoming request to /api");
    console.log("Received URL:", url);
    console.log("Received text length:", text ? text.length : 0);
    console.log("Received images count:", images ? images.length : 0);

    const prompt = `
      Extract product details from the following page content.
      Return a JSON object with these fields: 
      "name", "image", "link", "size", and "contact".
      
      Text: ${text}
      Images: ${images ? images.join(", ") : ""}
    `;

    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
    });

    console.log("AI response received");
    const data = JSON.parse(aiResponse.choices[0].message.content);
    data.link = url || "";

    res.json(data);
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({
      error: "Failed to process data",
      details: error.message,
    });
  }
});

// For local development
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// For Vercel
export default app;
