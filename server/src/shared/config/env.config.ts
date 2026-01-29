import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  port: number;
  nodeEnv: string;
  mongodbUri: string;
  dbMaxRetries: number;
  jwtSecret: string;
  jwtExpiry: string;
  refreshTokenExpiry: string;
  googleClientId: string;
  googleClientSecret: string;
  facebookAppId: string;
  facebookAppSecret: string;
  facebookGraphApiVersion: string;
  emailService: string;
  emailHost: string;
  emailPort: number;
  emailUser: string;
  emailPassword: string;
  emailFrom: string;
  otpExpiry: string;
  otpResendCooldown: string;
  bcryptSaltRounds: number;
  rateLimitWindow: string;
  rateLimitMaxRequests: number;
  corsOrigin: string;
  redisUrl: string;
}

/**
 * Get required environment variable
 * Throws error if not set
 */
const getRequiredEnvVariable = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`❌ REQUIRED environment variable ${key} is not set. Check your .env file.`);
  }
  return value;
};

/**
 * Get optional environment variable with default value
 */
const getOptionalEnvVariable = (key: string, defaultValue: string): string => {
  return process.env[key] || defaultValue;
};

/**
 * Validate JWT secret strength in production
 */
const validateJWTSecret = (secret: string, nodeEnv: string): void => {
  if (nodeEnv === 'production') {
    if (secret.length < 32) {
      throw new Error(
        '❌ SECURITY ERROR: JWT_SECRET must be at least 32 characters in production!'
      );
    }
    if (secret.includes('change-this') || secret.includes('your-')) {
      throw new Error(
        '❌ SECURITY ERROR: JWT_SECRET appears to be a placeholder. Use a strong random secret!'
      );
    }
  }
};

/**
 * Validate production environment settings
 */
const validateProductionConfig = (nodeEnv: string, config: EnvConfig): void => {
  if (nodeEnv === 'production') {
    const warnings: string[] = [];

    // Check MongoDB URI
    if (config.mongodbUri.includes('localhost')) {
      warnings.push('⚠️  WARNING: Using localhost MongoDB in production. Consider using MongoDB Atlas.');
    }

    // Check CORS origin
    if (config.corsOrigin.includes('localhost')) {
      warnings.push('⚠️  WARNING: CORS_ORIGIN includes localhost in production.');
    }

    // Check email configuration
    if (config.emailService === 'gmail') {
      warnings.push('⚠️  WARNING: Using Gmail for production emails. Consider SendGrid or AWS SES.');
    }

    // Display warnings
    if (warnings.length > 0) {
      console.warn('\n🔔 Production Configuration Warnings:');
      warnings.forEach((warning) => console.warn(warning));
      console.warn('');
    }
  }
};

// Load and validate configuration
const loadConfig = (): EnvConfig => {
  console.log('📋 Loading environment configuration...');

  // Required variables
  const nodeEnv = getRequiredEnvVariable('NODE_ENV');
  const mongodbUri = getRequiredEnvVariable('MONGODB_URI');
  const jwtSecret = getRequiredEnvVariable('JWT_SECRET');
  const googleClientId = getRequiredEnvVariable('GOOGLE_CLIENT_ID');
  const googleClientSecret = getRequiredEnvVariable('GOOGLE_CLIENT_SECRET');
  const emailUser = getRequiredEnvVariable('EMAIL_USER');
  const emailPassword = getRequiredEnvVariable('EMAIL_PASSWORD');
  
  // Optional OAuth variables (Facebook)
  const facebookAppId = getOptionalEnvVariable('FACEBOOK_APP_ID', '');
  const facebookAppSecret = getOptionalEnvVariable('FACEBOOK_APP_SECRET', '');

  // Validate JWT secret
  validateJWTSecret(jwtSecret, nodeEnv);

  // Optional variables with defaults
  const config: EnvConfig = {
    port: parseInt(getOptionalEnvVariable('PORT', '5001'), 10),
    nodeEnv,
    mongodbUri,
    dbMaxRetries: parseInt(getOptionalEnvVariable('DB_MAX_RETRIES', '5'), 10),
    jwtSecret,
    jwtExpiry: getOptionalEnvVariable('JWT_EXPIRY', '24h'),
    refreshTokenExpiry: getOptionalEnvVariable('REFRESH_TOKEN_EXPIRY', '7d'),
    googleClientId,
    googleClientSecret,
    facebookAppId,
    facebookAppSecret,
    facebookGraphApiVersion: getOptionalEnvVariable('FACEBOOK_GRAPH_API_VERSION', 'v18.0'),
    emailService: getOptionalEnvVariable('EMAIL_SERVICE', 'gmail'),
    emailHost: getOptionalEnvVariable('EMAIL_HOST', 'smtp.gmail.com'),
    emailPort: parseInt(getOptionalEnvVariable('EMAIL_PORT', '587'), 10),
    emailUser,
    emailPassword,
    emailFrom: getOptionalEnvVariable('EMAIL_FROM', 'noreply@ppc.com'),
    otpExpiry: getOptionalEnvVariable('OTP_EXPIRY', '5m'),
    otpResendCooldown: getOptionalEnvVariable('OTP_RESEND_COOLDOWN', '30s'),
    bcryptSaltRounds: parseInt(getOptionalEnvVariable('BCRYPT_SALT_ROUNDS', '10'), 10),
    rateLimitWindow: getOptionalEnvVariable('RATE_LIMIT_WINDOW', '15m'),
    rateLimitMaxRequests: parseInt(getOptionalEnvVariable('RATE_LIMIT_MAX_REQUESTS', '100'), 10),
    corsOrigin: getOptionalEnvVariable('CORS_ORIGIN', 'http://localhost:5173'),
    redisUrl: getOptionalEnvVariable('REDIS_URL', 'redis://localhost:6379'),
  };

  // Validate production settings
  validateProductionConfig(nodeEnv, config);

  console.log('✅ Environment configuration loaded successfully');
  console.log(`📍 Environment: ${config.nodeEnv}`);
  console.log(`🚪 Port: ${config.port}`);

  return config;
};

const config = loadConfig();

export default config;
