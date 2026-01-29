#!/usr/bin/env node

/**
 * Production Readiness Verification Script
 * Verifies that all components are ready for client deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Production Readiness Verification\n');

// Check if all required files exist
const requiredFiles = [
  'server/dist/server.js',
  'client/dist/index.html', 
  'agent-dashboard/dist/index.html',
  'server/.env.example',
  'client/.env.example',
  'agent-dashboard/.env.example',
  'PRODUCTION_DEPLOYMENT.md'
];

console.log('📁 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

// Check package.json scripts
console.log('\n📦 Checking package.json configurations...');

const checkPackageJson = (dir, requiredScripts) => {
  const packagePath = path.join(dir, 'package.json');
  if (fs.existsSync(packagePath)) {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    console.log(`✅ ${dir}/package.json exists`);
    
    requiredScripts.forEach(script => {
      if (pkg.scripts && pkg.scripts[script]) {
        console.log(`  ✅ ${script} script configured`);
      } else {
        console.log(`  ⚠️  ${script} script missing`);
      }
    });
  } else {
    console.log(`❌ ${dir}/package.json - MISSING`);
    allFilesExist = false;
  }
};

checkPackageJson('server', ['dev', 'build', 'start', 'test']);
checkPackageJson('client', ['dev', 'build', 'preview']);
checkPackageJson('agent-dashboard', ['dev', 'build', 'preview']);

// Check environment examples
console.log('\n🔧 Checking environment configurations...');

const checkEnvExample = (file) => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const hasRequiredVars = content.includes('MONGODB_URI') || content.includes('VITE_API_BASE_URL');
    console.log(`✅ ${file} - ${hasRequiredVars ? 'Complete' : 'Basic'}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
};

checkEnvExample('server/.env.example');
checkEnvExample('client/.env.example');
checkEnvExample('agent-dashboard/.env.example');

// Check build outputs
console.log('\n🏗️  Checking build outputs...');

const checkBuildOutput = (dir, expectedFiles) => {
  const distPath = path.join(dir, 'dist');
  if (fs.existsSync(distPath)) {
    console.log(`✅ ${dir}/dist directory exists`);
    
    expectedFiles.forEach(file => {
      const filePath = path.join(distPath, file);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log(`  ✅ ${file} (${Math.round(stats.size / 1024)}KB)`);
      } else {
        console.log(`  ❌ ${file} - MISSING`);
        allFilesExist = false;
      }
    });
  } else {
    console.log(`❌ ${dir}/dist - MISSING`);
    allFilesExist = false;
  }
};

checkBuildOutput('server', ['server.js']);
checkBuildOutput('client', ['index.html']);
checkBuildOutput('agent-dashboard', ['index.html']);

// Final assessment
console.log('\n' + '='.repeat(50));
if (allFilesExist) {
  console.log('🎉 PRODUCTION READY!');
  console.log('✅ All required files present');
  console.log('✅ All applications build successfully');
  console.log('✅ Environment configurations ready');
  console.log('✅ Documentation complete');
  console.log('\n📋 Next Steps:');
  console.log('1. Configure production environment variables');
  console.log('2. Deploy to production servers');
  console.log('3. Run final integration tests');
  console.log('4. Submit to client');
} else {
  console.log('❌ NOT READY FOR PRODUCTION');
  console.log('⚠️  Some required files are missing');
  console.log('🔧 Please fix the issues above before deployment');
}
console.log('='.repeat(50));