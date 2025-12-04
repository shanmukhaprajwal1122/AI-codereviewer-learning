const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controllers');  // Changed: removed .js and made it plural
const diagramController = require('../controllers/ai.diagram.controller');

// Code review route
router.post('/get-review', aiController.getResponse);

// Diagram generation route
router.post('/generate-diagram', diagramController.generateDiagram);

// Health check route (optional)
// router.get('/health', aiController.healthCheck);

module.exports = router;