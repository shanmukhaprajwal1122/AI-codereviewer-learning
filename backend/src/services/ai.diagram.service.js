const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function generateDiagram(code, language, diagramType) {
  let systemPrompt = "";

  switch (diagramType) {
    case "class":
      systemPrompt = `You are an expert at analyzing code and creating class diagrams. 
      - Classes and their properties
      - Methods and their parameters
      - Relationships (inheritance, composition, association)
      - Access modifiers (public, private, protected)
      
      Return ONLY the Mermaid syntax, no markdown code blocks, no explanations.
      Example format:
      classDiagram
          class Animal {
              +String name
              +int age
              +makeSound()
          }
          class Dog {
              +String breed
              +bark()
          }
          Animal <|-- Dog`;
      break;

    case "flowchart":
      systemPrompt = `You are an expert at analyzing code and creating flowcharts.
      Analyze the provided ${language} code and generate a Mermaid flowchart showing:
      - Program flow and control structures
      - Decision points (if/else)
      - Loops (for, while)
      - Function calls
      - Start and end points
      
      Return ONLY the Mermaid syntax, no markdown code blocks, no explanations.
      Example format:
      flowchart TD
          Start([Start]) --> Input[Get Input]
          Input --> Process{Is Valid?}
          Process -->|Yes| Calculate[Calculate Result]
          Process -->|No| Error[Show Error]
          Calculate --> Output[Display Output]
          Error --> End([End])
          Output --> End`;
      break;

    case "sequence":
      systemPrompt = `You are an expert at analyzing code and creating sequence diagrams.
      Analyze the provided ${language} code and generate a Mermaid sequence diagram showing:
      - Object interactions
      - Method calls between objects
      - Message passing
      - Lifelines and activations
      
      Return ONLY the Mermaid syntax, no markdown code blocks, no explanations.
      Example format:
      sequenceDiagram
          participant User
          participant System
          participant Database
          User->>System: Request Data
          System->>Database: Query
          Database-->>System: Results
          System-->>User: Display Data`;
      break;

    case "er":
      systemPrompt = `You are an expert at analyzing code and creating ER diagrams.
      Analyze the provided ${language} code (especially database models or data structures) and generate a Mermaid ER diagram showing:
      - Entities and their attributes
      - Relationships between entities
      - Cardinality (one-to-one, one-to-many, many-to-many)
      
      Return ONLY the Mermaid syntax, no markdown code blocks, no explanations.
      Example format:
      erDiagram
          USER ||--o{ ORDER : places
          USER {
              string id
              string name
              string email
          }
          ORDER {
              string id
              string userId
              date orderDate
          }`;
      break;

    default:
      systemPrompt = "Generate a class diagram showing the code structure.";
  }

  const chatCompletion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",  // ✅ CHANGED: Updated to active model
    messages: [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: `Generate a ${diagramType} diagram for this ${language} code:\n\n${code}`
      }
    ],
    temperature: 0.3,
    max_tokens: 2000
  });

  return chatCompletion.choices[0].message.content;
}

module.exports = generateDiagram;