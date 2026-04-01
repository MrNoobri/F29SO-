const { GoogleGenerativeAI } = require("@google/generative-ai");

// Check if API key is available and valid
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
let genAI = null;
let USE_MOCK_MODE = true;

// Try to initialize Gemini if key is present
if (GEMINI_API_KEY && GEMINI_API_KEY.length > 20) {
  try {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    USE_MOCK_MODE = false;
    console.log("✓ Gemini API initialized with key");
  } catch (error) {
    console.log("⚠️ Gemini API initialization failed, using mock mode");
    USE_MOCK_MODE = true;
  }
} else {
  console.log("⚠️ No Gemini API key found, using mock mode");
}

const SYSTEM_PROMPT = `You are MEDXI Health Assistant, a helpful and knowledgeable AI health companion. You provide practical health information, wellness guidance, and lifestyle recommendations.

YOUR ROLE:
- Provide helpful, actionable health and wellness advice
- Share general health information and lifestyle tips
- Explain health concepts in simple, clear language
- Suggest healthy habits, diets, and exercise routines
- Help users understand general health metrics
- Be supportive, friendly, and encouraging

EXAMPLES OF WHAT YOU CAN HELP WITH:
- "Give me a healthy diet" → Provide a sample healthy eating plan with examples
- "How can I sleep better?" → Share sleep hygiene tips and routines
- "What exercises should I do?" → Suggest workout routines for different goals
- "How much water should I drink?" → Explain hydration guidelines
- "Tips for managing stress?" → Share stress management techniques

IMPORTANT DISCLAIMERS (mention when relevant, but be helpful first):
- For specific medical conditions or symptoms, recommend seeing a healthcare provider
- You cannot diagnose conditions or prescribe medications
- For interpreting personal test results, suggest consulting their doctor

EMERGENCY PROTOCOL:
If someone mentions: chest pain, difficulty breathing, severe bleeding, unconscious, suicide - immediately tell them to call 911 or go to ER.

TONE: Helpful, practical, and supportive. Give specific, actionable advice. Be conversational and friendly. Don't be overly cautious - if someone asks for a healthy diet, give them one!`;

/**
 * Send message to Gemini AI
 */
const sendChatMessage = async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    // Check for emergency keywords
    const emergencyKeywords = [
      "emergency",
      "chest pain",
      "can't breathe",
      "difficulty breathing",
      "severe pain",
      "bleeding heavily",
      "unconscious",
      "suicide",
      "kill myself",
    ];

    const lowerMessage = message.toLowerCase();
    const hasEmergency = emergencyKeywords.some((keyword) =>
      lowerMessage.includes(keyword),
    );

    if (hasEmergency) {
      return res.json({
        success: true,
        data: {
          response:
            "⚠️ **THIS SOUNDS LIKE A MEDICAL EMERGENCY**\n\nPlease call emergency services immediately:\n- US/Canada: 911\n- UK: 999\n- EU: 112\n\nOr go to the nearest emergency room right away. Do not wait for online advice. Your safety is the top priority.",
          isEmergency: true,
        },
      });
    }

    // Helper function for mock responses
    const getMockResponse = (message) => {
      const mockResponses = {
        hello:
          "Hello! I'm your MEDXI Health Assistant. How can I help you with your health questions today?",
        blood:
          "A healthy blood pressure is typically around 120/80 mmHg. However, this can vary by age and individual health conditions. If you're concerned about your blood pressure, I recommend consulting with your healthcare provider for personalized advice.",
        sleep:
          "Most adults need 7-9 hours of quality sleep per night. Good sleep hygiene includes maintaining a consistent sleep schedule, creating a comfortable sleep environment, and avoiding screens before bedtime. If you're having persistent sleep issues, please consult your doctor.",
        heart:
          "A normal resting heart rate for adults ranges from 60-100 beats per minute. Athletes might have lower rates. Your heart rate can be affected by fitness level, stress, medications, and health conditions.",
        diabetes:
          "Managing diabetes involves monitoring blood sugar levels regularly, following a balanced diet, staying physically active, taking medications as prescribed, and working closely with your healthcare team. If you have specific concerns about diabetes management, please consult your doctor.",
        exercise:
          "The CDC recommends at least 150 minutes of moderate-intensity aerobic activity or 75 minutes of vigorous-intensity activity per week, plus muscle-strengthening activities on 2 or more days. Always consult your doctor before starting a new exercise program.",
        water:
          "A general guideline is to drink about 8 glasses (64 ounces) of water per day, but individual needs vary based on activity level, climate, and health conditions. A good indicator is the color of your urine - it should be pale yellow.",
        weight:
          "Healthy weight management involves a balanced diet, regular physical activity, adequate sleep, and stress management. Sustainable weight loss is typically 1-2 pounds per week. For personalized advice, consult with a healthcare provider or registered dietitian.",
        default:
          "I understand your question about your health. As an AI assistant, I can provide general health information, but for specific medical advice related to your situation, I always recommend consulting with a qualified healthcare provider. They can give you personalized guidance based on your complete medical history. Is there any general health information I can help you understand better?",
      };

      let response = mockResponses.default;
      const lowerMsg = message.toLowerCase();

      if (
        lowerMsg.includes("hello") ||
        lowerMsg.includes("hi") ||
        lowerMsg.includes("hey")
      ) {
        response = mockResponses.hello;
      } else if (
        lowerMsg.includes("blood pressure") ||
        lowerMsg.includes("bp")
      ) {
        response = mockResponses.blood;
      } else if (lowerMsg.includes("sleep") || lowerMsg.includes("insomnia")) {
        response = mockResponses.sleep;
      } else if (
        lowerMsg.includes("heart rate") ||
        lowerMsg.includes("pulse")
      ) {
        response = mockResponses.heart;
      } else if (
        lowerMsg.includes("diabetes") ||
        lowerMsg.includes("blood sugar")
      ) {
        response = mockResponses.diabetes;
      } else if (
        lowerMsg.includes("exercise") ||
        lowerMsg.includes("workout") ||
        lowerMsg.includes("fitness")
      ) {
        response = mockResponses.exercise;
      } else if (lowerMsg.includes("water") || lowerMsg.includes("hydration")) {
        response = mockResponses.water;
      } else if (
        lowerMsg.includes("weight") ||
        lowerMsg.includes("lose weight") ||
        lowerMsg.includes("diet")
      ) {
        response = mockResponses.weight;
      }

      return (
        response +
        "\n\n_Note: Using simulated responses. The Gemini API key is being configured and will be available soon._"
      );
    };

    // MOCK MODE: Use simulated responses if Gemini API is not available
    if (USE_MOCK_MODE || !genAI) {
      console.log(
        "⚠️ Using mock AI mode - Gemini API key not configured or not working",
      );

      return res.json({
        success: true,
        data: {
          response: getMockResponse(message),
          isEmergency: false,
          mockMode: true,
        },
      });
    }

    // Try to use real Gemini API
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      // Build conversation context
      let prompt = SYSTEM_PROMPT + "\n\n";

      if (conversationHistory.length > 0) {
        prompt += "Previous conversation:\n";
        conversationHistory.slice(-5).forEach((msg) => {
          prompt += `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}\n`;
        });
        prompt += "\n";
      }

      prompt += `User: ${message}\nAssistant:`;

      // Generate response
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      return res.json({
        success: true,
        data: {
          response: text,
          isEmergency: false,
        },
      });
    } catch (apiError) {
      // If real API fails, fall back to mock mode
      console.error(
        "Gemini API error, falling back to mock mode:",
        apiError.message,
      );

      return res.json({
        success: true,
        data: {
          response: getMockResponse(message),
          isEmergency: false,
          mockMode: true,
        },
      });
    }
  } catch (error) {
    console.error("Chatbot error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to process your message. Please try again.",
    });
  }
};

/**
 * Get suggested questions
 */
const getSuggestedQuestions = async (req, res) => {
  try {
    const questions = [
      "What are healthy blood pressure ranges?",
      "How much sleep should I get each night?",
      "What's a healthy resting heart rate?",
      "How can I improve my daily step count?",
      "What are signs I should see a doctor?",
      "How do I maintain healthy blood sugar levels?",
      "What's the importance of regular exercise?",
      "How much water should I drink daily?",
    ];

    res.json({
      success: true,
      data: questions,
    });
  } catch (error) {
    console.error("Get suggested questions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve suggested questions",
    });
  }
};

module.exports = {
  sendChatMessage,
  getSuggestedQuestions,
};
