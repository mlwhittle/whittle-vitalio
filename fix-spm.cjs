const fs = require('fs');
const path = require('path');

const packageSwiftPath = path.join(__dirname, 'node_modules', '@capacitor-community', 'apple-sign-in', 'Package.swift');

if (fs.existsSync(packageSwiftPath)) {
    let content = fs.readFileSync(packageSwiftPath, 'utf8');
    
    // Change SPM Capacitor dependency from 7.0.0 to 8.0.0
    if (content.includes('from: "7.0.0"')) {
        content = content.replace(/from: "7\.0\.0"/g, 'from: "8.0.0"');
        fs.writeFileSync(packageSwiftPath, content);
        console.log('✅ Successfully patched @capacitor-community/apple-sign-in SPM dependency for Capacitor 8 Support');
    } else if (content.includes('from: "8.0.0"')) {
        console.log('✅ @capacitor-community/apple-sign-in SPM dependency is already patched.');
    } else {
        console.log('⚠️ Could not find exact "from: 7.0.0" string to patch in Apple Sign In plugin.');
    }
} else {
    console.log('⚠️ Package.swift for @capacitor-community/apple-sign-in not found. Skipping patch.');
}
