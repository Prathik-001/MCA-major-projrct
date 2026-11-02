const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

module.exports = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'uba_sentinel_super_secure_jwt_secret_change_in_production_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  databaseUrl: process.env.DATABASE_URL || '',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || '',
  mlEngineMode: process.env.ML_ENGINE_MODE || 'builtin',
  pythonMlServiceUrl: process.env.PYTHON_ML_SERVICE_URL || 'http://localhost:5001',
  auditChainSalt: process.env.AUDIT_CHAIN_SALT || 'uba_sentinel_audit_hmac_secret_sha256_chain_2026',
};
