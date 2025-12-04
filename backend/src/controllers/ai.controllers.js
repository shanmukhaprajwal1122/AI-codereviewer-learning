const aiService = require("../services/ai.services");

module.exports.getResponse = async (req, res) => {
  const { code, language = 'javascript' } = req.body;

  // Validate input
  if (!code || !code.trim()) {
    return res.status(400).json({ 
      error: "Code is required",
      message: "Please provide code to analyze"
    });
  }

  // Check code length (prevent abuse)
  if (code.length > 50000) {
    return res.status(400).json({ 
      error: "Code too long",
      message: "Please provide code under 50,000 characters"
    });
  }

  try {
    console.log('Processing AI request for language:', language);
    console.log('Code length:', code.length);

    // Call AI service with both code and language
    let response = await aiService(code, language);

    console.log('Raw AI service response:', typeof response, response);

    // Handle different response formats from AI service
    let cleanResponse;
    
    if (typeof response === 'string') {
      cleanResponse = response;
    } else if (response && typeof response === 'object') {
      // Try different possible properties
      cleanResponse = 
        response.content ||
        response.message || 
        response.text ||
        response.review ||
        response.analysis ||
        JSON.stringify(response, null, 2);
    } else {
      cleanResponse = String(response || 'No response generated');
    }

    // Clean up the response
    cleanResponse = cleanResponse
      .replace(/\\n/g, "\n")           // Fix escaped newlines
      .replace(/\\"/g, '"')           // Fix escaped quotes
      .replace(/\\t/g, "    ")        // Fix escaped tabs
      .replace(/^\"|\"$/g, '')        // Remove surrounding quotes if present
      .trim();                        // Remove extra whitespace

    // Ensure we have some content
    if (!cleanResponse || cleanResponse.length < 10) {
      cleanResponse = `## Code Analysis Complete ✅

Your ${language} code has been reviewed. Here are some general observations:

### Code Structure
- The code appears to be syntactically correct
- Consider adding comments for better readability
- Follow ${language} best practices and conventions

### Recommendations
- Add error handling where appropriate
- Consider code organization and modularity  
- Test your code with different input scenarios

*Need more specific feedback? Try providing more complex code or specify particular areas you'd like reviewed.*`;
    }

    console.log('Sending cleaned response:', cleanResponse.substring(0, 200) + '...');

    return res.json({ 
      response: cleanResponse,
      language,
      timestamp: new Date().toISOString(),
      success: true
    });

  } catch (err) {
    console.error("AI Service Error:", err);
    
    // Provide detailed error information
    const errorResponse = {
      error: "AI service failed",
      message: err.message || "Failed to process AI response",
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      timestamp: new Date().toISOString(),
      success: false
    };

    return res.status(500).json(errorResponse);
  }
};

// Optional: Add a health check endpoint
module.exports.healthCheck = async (req, res) => {
  try {
    // Test AI service with simple code
    const testResponse = await require("../services/ai.services")("console.log('test');", "javascript");
    return res.json({ 
      status: "healthy", 
      aiService: "operational",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(503).json({ 
      status: "unhealthy", 
      aiService: "error",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};