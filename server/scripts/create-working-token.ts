import * as tokenService from '../src/auth/services/token.service';

/**
 * Create a working JWT token with the role included for testing
 */

const createWorkingToken = (): void => {
  try {
    console.log('🔧 Creating working JWT token with role...');
    
    // Create token with role "agent"
    const token = tokenService.generateAccessToken(
      '69706139ce2238752fd047d5',  // User ID
      'agent@test.com',            // Email
      'email',                     // Auth provider
      'agent',                     // Role
      undefined,                   // Permissions
      'Legal'                      // Department
    );
    
    console.log('✅ Working token created:');
    console.log(token);
    
    // Validate the token
    const payload = tokenService.validateToken(token);
    console.log('\n📋 Token payload:');
    console.log(JSON.stringify(payload, null, 2));
    
  } catch (error) {
    console.error('❌ Error creating token:', error);
  }
};

console.log('🚀 Creating Working Token...\n');
createWorkingToken();
console.log('\n👋 Done');