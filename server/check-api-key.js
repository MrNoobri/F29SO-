require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function checkAPIKey() {
  try {
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    console.log("=== API Key Validation ===");
    console.log("- Key exists:", !!apiKey);
    console.log("- Starts with 'AIza':", apiKey?.startsWith("AIza"));
    console.log("- Length:", apiKey?.length);
    console.log("- First 25 chars:", apiKey?.substring(0, 25));
    console.log(
      "- Has quotes:",
      apiKey?.includes('"') || apiKey?.includes("'"),
    );
    console.log("- Has spaces:", apiKey?.includes(" "));

    if (!apiKey) {
      console.error("\nERROR: No API key found in .env file!");
      return;
    }

    if (!apiKey.startsWith("AIza")) {
      console.error(
        "\nERROR: API key format is incorrect! Should start with 'AIza'",
      );
      return;
    }

    console.log("\n=== Testing with Google Generative AI SDK ===");
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Try gemini-2.0-flash (2026 model from your curl)
    console.log("Trying gemini-2.0-flash...");
    let model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    console.log("Sending test request...");
    const result = await model.generateContent("Say hello in 3 words");

    console.log("\nSUCCESS! API Key is working!");
    console.log("Response:", result.response.text());
  } catch (error) {
    console.error("\nAPI Key Test Failed");
    console.error("Status:", error.status);
    console.error("Message:", error.message);

    if (error.status === 400) {
      console.log("\nTIP: HTTP 400 - API_KEY_INVALID");
      console.log("This usually means:");
      console.log("1. Check .env file has no quotes or spaces");
      console.log("2. Restart your terminal/VS Code after changing .env");
      console.log("3. Wait 5-10 minutes if key was just created");
      console.log(
        "4. Verify no API restrictions at https://aistudio.google.com/app/apikey",
      );
    }

    if (error.status === 404) {
      console.log("\nTIP: HTTP 404 - Model Not Found");
      console.log("Enable the API at:");
      console.log(
        "https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com",
      );
    }
  }
}

console.log("Testing Gemini API Key...\n");
checkAPIKey();
