import { OpenAI } from "openai";
import express from "express";
import cors from "cors";

const app = express();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Configure CORS with specific options
const corsOptions = {
  origin: "*", // Allow all origins
  methods: ["POST", "GET", "OPTIONS"], // Allowed methods
  allowedHeaders: ["Content-Type"], // Allowed headers
  credentials: true, // Enable credentials
  optionsSuccessStatus: 200, // Some legacy browsers (IE11) choke on 204
};

app.use(cors(corsOptions));
app.use(express.json());

app.post("/api", async (req, res) => {
  const { html, url } = req.body;
  console.log("Received request for URL:", url);

  const prompt = `
    Extract product details from this HTML page. Provide the following fields:
    - Product Name
    - Image URL
    - Product Link
    - Size (if available)
    - Contact Information (if available)
    
    Respond in JSON format: { "name": "", "image": "", "link": "", "size": "", "contact": "" }

    HTML content: ${html}
  `;

  try {
    console.log("Sending request to OpenAI...");
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
    });
    console.log("OpenAI Response:", aiResponse.choices[0].message.content);

    let extractedData = JSON.parse(aiResponse.choices[0].message.content);
    extractedData.link = url; // Ensure correct product link

    res.json(extractedData);
  } catch (error) {
    console.error("OpenAI Error:", error);
    res.status(500).json({ error: "Failed to process data" });
  }
});
app.listen(3000, () => console.log("Server running on port 3000"));
