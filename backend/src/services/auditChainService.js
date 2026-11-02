const crypto = require('crypto');
const db = require('../database/db');
const config = require('../config');

const GENESIS_HASH = crypto.createHash('sha256').update('GENESIS_BLOCK_UBA_SENTINEL_ROOT').digest('hex');

class AuditChainService {
  /**
   * Computes SHA-256 hash for a block
   */
  static computeHash(previousHash, payload) {
    const serializedPayload = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return crypto.createHash('sha256')
      .update(previousHash + serializedPayload + (config.auditChainSalt || ''))
      .digest('hex');
  }

  /**
   * Append a new audit record to the cryptographic hash chain
   */
  static async appendRecord(eventId, eventPayload) {
    try {
      const records = await db.find('audit_chain_records');
      records.sort((a, b) => a.sequence_number - b.sequence_number);

      const lastRecord = records.length > 0 ? records[records.length - 1] : null;
      const sequenceNumber = lastRecord ? (lastRecord.sequence_number + 1) : 1;
      const previousHash = lastRecord ? lastRecord.current_hash : GENESIS_HASH;

      const currentHash = this.computeHash(previousHash, eventPayload);

      const record = {
        sequence_number: sequenceNumber,
        event_id: eventId,
        event_payload: eventPayload,
        previous_hash: previousHash,
        current_hash: currentHash,
        signature: 'SHA256_CHAINED_SIGNATURE',
        timestamp: new Date().toISOString()
      };

      return await db.insert('audit_chain_records', record);
    } catch (err) {
      console.error('Audit chain append error:', err.message);
      throw err;
    }
  }

  /**
   * Cryptographically verifies the entire audit log chain
   * Detects modified content, swapped records, deleted blocks, or broken linkages
   */
  static async verifyChain() {
    const records = await db.find('audit_chain_records');
    records.sort((a, b) => a.sequence_number - b.sequence_number);

    if (records.length === 0) {
      return {
        isValid: true,
        totalRecords: 0,
        message: 'Chain is empty. No records to verify.',
        verifiedAt: new Date().toISOString()
      };
    }

    let expectedPreviousHash = GENESIS_HASH;

    for (let i = 0; i < records.length; i++) {
      const block = records[i];
      const expectedSequence = i + 1;

      // 1. Verify sequence order continuity
      if (block.sequence_number !== expectedSequence) {
        return {
          isValid: false,
          brokenSequenceNumber: block.sequence_number,
          totalRecords: records.length,
          verifiedUpto: i,
          errorType: 'SEQUENCE_GAP_OR_DELETION',
          errorDetails: `Sequence continuity broken at block ${block.sequence_number}. Expected sequence ${expectedSequence}. Possible record deletion detected.`,
          compromisedBlock: block,
          verifiedAt: new Date().toISOString()
        };
      }

      // 2. Verify previous_hash linkage
      if (block.previous_hash !== expectedPreviousHash) {
        return {
          isValid: false,
          brokenSequenceNumber: block.sequence_number,
          totalRecords: records.length,
          verifiedUpto: i,
          errorType: 'PREVIOUS_HASH_MISMATCH',
          errorDetails: `Linkage broken at block ${block.sequence_number}. previous_hash does not match the predecessor block's current_hash.`,
          expectedPreviousHash,
          actualPreviousHash: block.previous_hash,
          compromisedBlock: block,
          verifiedAt: new Date().toISOString()
        };
      }

      // 3. Verify content integrity by recomputing SHA-256
      const computedHash = this.computeHash(block.previous_hash, block.event_payload);
      if (computedHash !== block.current_hash) {
        return {
          isValid: false,
          brokenSequenceNumber: block.sequence_number,
          totalRecords: records.length,
          verifiedUpto: i,
          errorType: 'PAYLOAD_TAMPERING_DETECTED',
          errorDetails: `Cryptographic hash integrity violation at sequence ${block.sequence_number}. The stored hash does not match payload content. The event payload was modified after insertion!`,
          expectedHash: computedHash,
          storedHash: block.current_hash,
          compromisedBlock: block,
          verifiedAt: new Date().toISOString()
        };
      }

      expectedPreviousHash = block.current_hash;
    }

    return {
      isValid: true,
      totalRecords: records.length,
      verifiedUpto: records.length,
      latestHash: expectedPreviousHash,
      message: 'Cryptographic chain verification successful. All SHA-256 hashes and sequence links are authentic and untampered.',
      verifiedAt: new Date().toISOString()
    };
  }

  /**
   * Demonstration Utility: Simulates tampering on a specific record
   * Used for SOC test demonstration of detection capabilities
   */
  static async simulateTamper(sequenceNumber, forgedPayload) {
    const targetBlock = await db.findOne('audit_chain_records', r => r.sequence_number === parseInt(sequenceNumber, 10));
    if (!targetBlock) {
      throw new Error(`Record with sequence number ${sequenceNumber} not found.`);
    }

    const modifiedPayload = {
      ...targetBlock.event_payload,
      tampered: true,
      original_action: targetBlock.event_payload.action,
      action: forgedPayload || 'UNAUTHORIZED_ADMIN_DATA_PURGE',
      tampered_at: new Date().toISOString()
    };

    await db.update(
      'audit_chain_records',
      r => r.sequence_number === parseInt(sequenceNumber, 10),
      { event_payload: modifiedPayload }
    );

    return {
      message: `Simulated tamper applied to sequence ${sequenceNumber}. Run verification to detect anomaly.`,
      targetSequence: sequenceNumber
    };
  }
}

module.exports = AuditChainService;
