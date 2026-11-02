const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authenticateToken = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const AuditChainService = require('../services/auditChainService');

// Get audit log chain records (Administrator only)
router.get('/', authenticateToken, requireRole(['Administrator']), async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const records = await db.find('audit_chain_records');
    records.sort((a, b) => b.sequence_number - a.sequence_number); // Newest first for view

    return res.json({
      total: records.length,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      records: records.slice(parseInt(offset, 10), parseInt(offset, 10) + parseInt(limit, 10))
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Run Cryptographic Hash-Chain Verification
router.get('/verify', authenticateToken, requireRole(['Administrator']), async (req, res) => {
  try {
    const verificationReport = await AuditChainService.verifyChain();
    return res.json(verificationReport);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Simulate Tamper on a specific sequence block (For test demonstration)
router.post('/simulate-tamper', authenticateToken, requireRole(['Administrator']), async (req, res) => {
  try {
    const { sequenceNumber, forgedAction } = req.body;
    if (!sequenceNumber) return res.status(400).json({ error: 'Sequence number is required.' });

    const result = await AuditChainService.simulateTamper(sequenceNumber, forgedAction);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
