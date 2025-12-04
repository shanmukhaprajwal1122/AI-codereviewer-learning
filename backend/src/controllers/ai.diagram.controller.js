const generateDiagramService = require("../services/ai.diagram.service");

module.exports.generateDiagram = async (req, res) => {
  const { code, language = 'javascript', diagramType = 'class' } = req.body;

  console.log('=== Diagram Generation Request ===');
  console.log('Language:', language);
  console.log('Diagram Type:', diagramType);
  console.log('Code length:', code?.length);

  // Validate input
  if (!code || !code.trim()) {
    return res.status(400).json({ 
      error: "Code is required",
      message: "Please provide code to generate a diagram"
    });
  }

  // Check code length
  if (code.length > 50000) {
    return res.status(400).json({ 
      error: "Code too long",
      message: "Please provide code under 50,000 characters"
    });
  }

  // Validate diagram type
  const validTypes = ['class', 'flowchart', 'sequence', 'er'];
  if (!validTypes.includes(diagramType)) {
    return res.status(400).json({
      error: "Invalid diagram type",
      message: `Diagram type must be one of: ${validTypes.join(', ')}`
    });
  }

  try {
    console.log(`Generating ${diagramType} diagram for ${language} code`);

    // Call AI service
    let diagram = await generateDiagramService(code, language, diagramType);

    console.log('Raw diagram response received');
    console.log('Response preview:', diagram.substring(0, 100));

    // Clean up the response
    diagram = diagram
      .replace(/```mermaid\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    // Ensure we have valid content
    if (!diagram || diagram.length < 10) {
      console.error('Generated diagram is too short or empty');
      return res.status(500).json({
        error: "Diagram generation failed",
        message: "No valid diagram was generated. The code may be too simple or complex."
      });
    }

    console.log('Successfully generated diagram, sending response');

    return res.json({ 
      diagram,
      diagramType,
      language,
      timestamp: new Date().toISOString(),
      success: true
    });

  } catch (err) {
    console.error("=== Diagram Generation Error ===");
    console.error("Error message:", err.message);
    console.error("Error stack:", err.stack);
    console.error("Error details:", err);
    
    const errorResponse = {
      error: "Diagram generation failed",
      message: err.message || "Failed to generate diagram",
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      timestamp: new Date().toISOString(),
      success: false
    };

    return res.status(500).json(errorResponse);
  }
};