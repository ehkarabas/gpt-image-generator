const { OpenAI } = require("openai");
require("dotenv").config();

async function testOpenAIConnection() {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log("Testing OpenAI connection...");

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o",
      messages: [{ role: "user", content: "Test connection" }],
      max_tokens: 5,
    });

    console.log("✅ OpenAI connection successful");
    console.log("Model:", process.env.OPENAI_MODEL || "gpt-4o");
    console.log("Response:", response.choices[0].message.content);

    // Test image generation
    const imageResponse = await openai.images.generate({
      model: process.env.OPENAI_IMAGE_MODEL || "dall-e-3",
      prompt: "Test image",
      n: 1,
      size: "1024x1024",
    });

    console.log("✅ Image generation successful");
    console.log("Image URL:", imageResponse.data[0].url);
  } catch (error) {
    console.error("❌ OpenAI connection failed:", error.message);
    process.exit(1);
  }
}

testOpenAIConnection();
