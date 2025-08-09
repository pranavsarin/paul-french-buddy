const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Chat endpoint
app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // System prompt for Paul
    const systemPrompt = `You are Paul, a friendly French man in his late 20s from Paris.
You speak casually, like a buddy.
Always respond in French unless the user is completely lost.
At the end, give a very short correction if there is a mistake in the user's last message, otherwise say "Aucune correction nécessaire."
Output ONLY valid JSON:
{
  "reply": "<Paul's French reply>",
  "correction": "<short correction or 'Aucune correction nécessaire.'>"
}`;

    // Call Ollama API
    const response = await axios.post('http://localhost:11434/api/generate', {
      model: 'mistral',
      prompt: `${systemPrompt}\n\nUser message: "${message}"\n\nResponse:`,
      stream: false,
      format: 'json'
    });

    let aiResponse = response.data.response;
    
    // Try to parse JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (parseError) {
      // Fallback if JSON parsing fails
      console.warn('Failed to parse JSON response, creating fallback');
      parsedResponse = {
        reply: "Désolé, j'ai eu un petit problème technique. Peux-tu répéter ?",
        correction: "Aucune correction nécessaire."
      };
    }

    // Validate response structure
    if (!parsedResponse.reply || !parsedResponse.correction) {
      parsedResponse = {
        reply: parsedResponse.reply || "Salut ! Comment ça va ?",
        correction: parsedResponse.correction || "Aucune correction nécessaire."
      };
    }

    res.json(parsedResponse);
  } catch (error) {
    console.error('Error calling Ollama:', error.message);
    
    // Fallback response
    res.json({
      reply: "Désolé, j'ai des difficultés à te comprendre en ce moment. Peux-tu essayer encore ?",
      correction: "Aucune correction nécessaire."
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Paul's backend server is running on http://localhost:${PORT}`);
  console.log('Make sure Ollama is running with: ollama run mistral');
});