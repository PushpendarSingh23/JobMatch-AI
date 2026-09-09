const fs = require('fs');
const path = require('path');

const targetFile = path.join(
  __dirname,
  '..',
  'node_modules',
  '@asgardeo',
  'nextjs',
  'dist',
  'esm',
  'server',
  'actions',
  'handleOAuthCallbackAction.js'
);

if (fs.existsSync(targetFile)) {
  let content = fs.readFileSync(targetFile, 'utf8');
  
  // Replace direct signInResult['expiresIn'] access with safe extraction fallback
  const oldLine = "const expiresIn = signInResult['expiresIn'];";
  const newLine = "const rawExpiresIn = signInResult['expiresIn'] ?? signInResult['expires_in'];\n" +
                  "                const expiresIn = Number.isNaN(Number(rawExpiresIn)) ? 3600 : Number(rawExpiresIn);";
                  
  if (content.includes(oldLine)) {
    content = content.replace(oldLine, newLine);
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log('[patch-asgardeo] Successfully patched handleOAuthCallbackAction.js');
  } else if (content.includes('rawExpiresIn')) {
    console.log('[patch-asgardeo] handleOAuthCallbackAction.js already patched');
  } else {
    console.warn('[patch-asgardeo] Warning: target pattern not found in handleOAuthCallbackAction.js');
  }
} else {
  console.warn('[patch-asgardeo] Target file not found:', targetFile);
}
