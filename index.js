import express from "express";
import { OpenAI } from "openai";
import dotenv from "dotenv";
import cors from "express-cors";

dotenv.config();

const app = express();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Use cors middleware
app.use(
  cors({
    allowedOrigins: ["*"],
    headers: ["Content-Type"],
  })
);

app.use(express.json());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something broke!" });
});

app.post("/api", async (req, res) => {
  try {
    const { text, images, url } = req.body;

    // Debug logs
    console.log("Incoming request to /api");
    console.log("Received URL:", url);
    console.log("Received text length:", text ? text.length : 0);
    console.log("Received images:", images);

    const prompt = `
      Extract product details from the following page content.
      Return a JSON object with these fields: 
      "name", "image", "link", "size", and "contact".
      
      Text: ${text}
      Images: ${images.join(", ")}
    `;

    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
    });

    console.log("AI raw response:", aiResponse.choices[0].message.content);

    const data = JSON.parse(aiResponse.choices[0].message.content);
    data.link = url || "";
    res.json(data);
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ error: "Failed to process data" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(
    "OpenAI Key:",
    process.env.OPENAI_API_KEY ? "Loaded" : "Not found"
  );
});
