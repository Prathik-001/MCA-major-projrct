const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const SimulationService = require('../services/simulationService');
const CertImportService = require('../services/certImportService');

// Trigger controlled synthetic attack scenario (Administrator only)
router.post('/trigger', authenticateToken, requireRole(['Administrator']), async (req, res) => {
  try {
    const { scenarioKey, targetUserId } = req.body;
    if (!scenarioKey) return res.status(400).json({ error: 'Scenario key is required.' });

    const result = await SimulationService.runScenario(scenarioKey, targetUserId);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Import and ingest CERT Insider Threat Dataset r4.2 sample slice
router.post('/cert-import', authenticateToken, requireRole(['Administrator']), async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const result = await CertImportService.importSampleSlice(targetUserId);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
