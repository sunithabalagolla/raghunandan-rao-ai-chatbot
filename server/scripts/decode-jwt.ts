import jwt from 'jsonwebtoken';

/**
 * Simple JWT Decoder Script
 * 
 * This script decodes a JWT token to see its raw content
 */

const decodeJWT = (token: string): void => {
  try {
    console.log(`🔍 Decoding JWT token...`);
    console.log(`🎫 Token: ${token}\n`);
    
    // Decode without verification to see raw content
    const decoded = jwt.decode(token);
    
    console.log(`📋 Raw decoded content:`);
    console.log(JSON.stringify(decoded, null, 2));
    
    // Also try to decode the payload manually
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = Buffer.from(parts[1], 'base64').toString('utf8');
      console.log(`\n📋 Manual payload decode:`);
      console.log(payload);
      
      const parsedPayload = JSON.parse(payload);
      console.log(`\n📋 Parsed payload:`);
      console.log(JSON.stringify(parsedPayload, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error decoding JWT:', error);
  }
};

const main = (): void => {
  const token = process.argv[2];
  
  if (!token) {
    console.error('❌ Please provide JWT token as argument');
    console.log('Usage: npm run decode-jwt "your-jwt-token-here"');
    process.exit(1);
  }
  
  decodeJWT(token);
};

// Run the script
main();