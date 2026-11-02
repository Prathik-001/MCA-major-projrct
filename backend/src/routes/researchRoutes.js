const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authenticateToken = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const ResearchEvalService = require('../services/researchEvalService');

// Get literature review database with verified citations
router.get('/literature', authenticateToken, requireRole(['Administrator', 'Manager']), (req, res) => {
  const papers = ResearchEvalService.getLiteratureReview();
  return res.json({
    researchProblem: 'Explainable Hybrid Framework for Insider Threat Detection Using User Behaviour Analytics and Dynamic Risk Scoring',
    researchHypothesis: 'Combining deterministic rule triggers with multi-feature Isolation Forest anomaly scoring and dynamic user baseline deviations yields superior F1-scores and lower operational false-positive rates than either technique in isolation.',
    papers
  });
});

// Run comparative evaluation
router.post('/evaluate', authenticateToken, requireRole(['Administrator']), async (req, res) => {
  try {
    const { sampleSize = 1000, testSplitRatio = 0.3 } = req.body;
    const report = await ResearchEvalService.runComparativeEvaluation({
      sampleSize: Math.min(5000, Math.max(100, parseInt(sampleSize, 10))),
      testSplitRatio: parseFloat(testSplitRatio)
    });
    return res.json(report);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Get historical model evaluation runs
router.get('/runs', authenticateToken, requireRole(['Administrator', 'Manager']), async (req, res) => {
  try {
    const runs = await db.find('model_runs');
    runs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return res.json({ runs });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
