const fs = require('fs');
const path = require('path');

function patchFile(filePath, replacements, description) {
  let realFilePath = filePath;
  try {
    if (fs.existsSync(filePath)) {
      realFilePath = fs.realpathSync(filePath);
    }
  } catch (e) {}

  if (!fs.existsSync(realFilePath)) {
    console.log(`[patch-asgardeo] File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(realFilePath, 'utf8');
  let modified = false;

  for (const { search, replace } of replacements) {
    if (typeof search === 'string') {
      if (content.includes(search)) {
        content = content.replace(search, replace);
        modified = true;
      }
    } else if (search instanceof RegExp) {
      if (search.test(content)) {
        content = content.replace(search, replace);
        modified = true;
      }
    }
  }

  if (modified) {
    fs.writeFileSync(realFilePath, content, 'utf8');
    console.log(`[patch-asgardeo] Successfully patched ${description}`);
    return true;
  } else {
    console.log(`[patch-asgardeo] Already patched or target content not found in ${description}`);
    return false;
  }
}

const asgardeoNextJsDir = path.join(__dirname, '..', 'node_modules', '@asgardeo', 'nextjs', 'dist', 'esm');

// 1. AsgardeoNextClient.js - Enable PKCE for SPA
patchFile(
  path.join(asgardeoNextJsDir, 'AsgardeoNextClient.js'),
  [
    {
      search: 'enablePKCE: false,',
      replace: "enablePKCE: (rest.enablePKCE !== false && process.env['NEXT_PUBLIC_ASGARDEO_ENABLE_PKCE'] !== 'false'),"
    }
  ],
  'AsgardeoNextClient.js (enablePKCE)'
);

// 2. utils/decorateConfigWithNextEnv.js - Pass enablePKCE
patchFile(
  path.join(asgardeoNextJsDir, 'utils', 'decorateConfigWithNextEnv.js'),
  [
    {
      search: "signUpUrl: signUpUrl || process.env['NEXT_PUBLIC_ASGARDEO_SIGN_UP_URL'],",
      replace: "signUpUrl: signUpUrl || process.env['NEXT_PUBLIC_ASGARDEO_SIGN_UP_URL'],\n        enablePKCE: config.enablePKCE ?? (process.env['NEXT_PUBLIC_ASGARDEO_ENABLE_PKCE'] !== 'false'),"
    }
  ],
  'decorateConfigWithNextEnv.js (enablePKCE)'
);

// 3. server/actions/signInAction.js - Include sessionId in state correlation & client init fallback
patchFile(
  path.join(asgardeoNextJsDir, 'server', 'actions', 'signInAction.js'),
  [
    {
      search: "const defaultSignInUrl = await client.getAuthorizeRequestUrl({}, sessionId);",
      replace: "const defaultSignInUrl = await client.getAuthorizeRequestUrl({ state: sessionId }, sessionId);"
    },
    {
      search: "const client = AsgardeoNextClient.getInstance();\n        const cookieStore = await cookies();",
      replace: "const client = AsgardeoNextClient.getInstance();\n        if (!client.isInitialized) { await client.initialize({}); }\n        const cookieStore = await cookies();"
    }
  ],
  'signInAction.js (state correlation & init fallback)'
);

// 4. server/actions/handleOAuthCallbackAction.js - Resilient sessionId recovery, initialization fallback, safe expiresIn & verbose error reporting
patchFile(
  path.join(asgardeoNextJsDir, 'server', 'actions', 'handleOAuthCallbackAction.js'),
  [
    {
      search: "const asgardeoClient = AsgardeoNextClient.getInstance();\n        if (!asgardeoClient.isInitialized) {\n            return {\n                error: 'Asgardeo client is not initialized',\n                success: false,\n            };\n        }",
      replace: "const asgardeoClient = AsgardeoNextClient.getInstance();\n        if (!asgardeoClient.isInitialized) {\n            await asgardeoClient.initialize({});\n        }"
    },
    {
      search: "if (!sessionId) {\n            logger.error('[handleOAuthCallbackAction] No session ID found in cookies or temporary session token.');\n            return {\n                error: 'No session found. Please start the authentication flow again.',\n                success: false,\n            };\n        }",
      replace: "if (!sessionId && state) {\n            const stateSession = state.includes('_request_') ? state.split('_request_')[0] : state;\n            if (stateSession && !stateSession.startsWith('instance_')) {\n                sessionId = stateSession;\n                console.log('[handleOAuthCallbackAction] Successfully recovered sessionId from state parameter:', sessionId);\n            }\n        }\n        if (!sessionId) {\n            logger.error('[handleOAuthCallbackAction] No session ID found in cookies, temporary session token, or state.');\n            return {\n                error: 'No session found. Please start the authentication flow again.',\n                success: false,\n            };\n        }"
    },
    {
      search: "const expiresIn = signInResult['expiresIn'];",
      replace: "const rawExpiresIn = signInResult['expiresIn'] ?? signInResult['expires_in'];\n                const expiresIn = Number.isNaN(Number(rawExpiresIn)) ? 3600 : Number(rawExpiresIn);"
    },
    {
      search: "catch (error) {\n        console.error('[handleOAuthCallbackAction CATCH]', error?.message || error);\n        return {\n            error: error instanceof Error ? (error.message || 'Authentication failed') : 'Authentication failed',\n            success: false,\n        };\n    }",
      replace: "catch (error) {\n        console.error('[handleOAuthCallbackAction CATCH]', {\n            message: error?.message,\n            code: error?.code,\n            description: error?.description,\n            data: error?.data || error?.response?.data,\n            error\n        });\n        const errMsg = error?.description || error?.message || (typeof error === 'string' ? error : 'Authentication failed');\n        return {\n            error: errMsg,\n            success: false,\n        };\n    }"
    },
    {
      search: "catch (error) {\n        return {\n            error: error instanceof Error ? error.message : 'Authentication failed',\n            success: false,\n        };\n    }",
      replace: "catch (error) {\n        console.error('[handleOAuthCallbackAction CATCH]', {\n            message: error?.message,\n            code: error?.code,\n            description: error?.description,\n            data: error?.data || error?.response?.data,\n            error\n        });\n        const errMsg = error?.description || error?.message || (typeof error === 'string' ? error : 'Authentication failed');\n        return {\n            error: errMsg,\n            success: false,\n        };\n    }"
    }
  ],
  'handleOAuthCallbackAction.js (session recovery, safe expiresIn & verbose error reporting)'
);

// 5. client/contexts/Asgardeo/AsgardeoProvider.js - Clean redirect on success & external login redirect without RSC parameters
patchFile(
  path.join(asgardeoNextJsDir, 'client', 'contexts', 'Asgardeo', 'AsgardeoProvider.js'),
  [
    {
      search: "if (result.success) {\n                        // Redirect to the success URL\n                        if (result.redirectUrl) {\n                            router.push(result.redirectUrl);\n                        }\n                        else {\n                            // Refresh the page to update authentication state\n                            window.location.reload();\n                        }\n                    }",
      replace: "if (result.success) {\n                        const target = result.redirectUrl || '/';\n                        window.location.href = target;\n                    }"
    },
    {
      search: "if (result?.data?.signInUrl) {\n            router.push(result.data.signInUrl);\n            return undefined;\n        }",
      replace: "if (result?.data?.signInUrl) {\n            window.location.href = result.data.signInUrl;\n            return undefined;\n        }"
    },
    {
      search: "if (result?.data?.signUpUrl) {\n            router.push(result.data.signUpUrl);\n            return undefined;\n        }",
      replace: "if (result?.data?.signUpUrl) {\n            window.location.href = result.data.signUpUrl;\n            return undefined;\n        }"
    }
  ],
  'client AsgardeoProvider.js (full window navigation on login)'
);

// 6. server/AsgardeoProvider.js - Pass afterSignInUrl / afterSignOutUrl
patchFile(
  path.join(asgardeoNextJsDir, 'server', 'AsgardeoProvider.js'),
  [
    {
      search: "await asgardeoClient.initialize(_config);",
      replace: "await asgardeoClient.initialize({ afterSignInUrl, afterSignOutUrl, ..._config });"
    }
  ],
  'server AsgardeoProvider.js (afterSignInUrl / afterSignOutUrl)'
);

// 7. @asgardeo/javascript - Preserve custom state parameter in getAuthorizeRequestUrlParams
try {
  const nextJsRealDir = fs.realpathSync(path.join(__dirname, '..', 'node_modules', '@asgardeo', 'nextjs'));
  const jsEntry = require.resolve('@asgardeo/javascript', { paths: [nextJsRealDir] });
  const asgardeoJsDir = path.dirname(path.dirname(jsEntry));
  ['index.js', path.join('cjs', 'index.js'), path.join('edge', 'index.js')].forEach(relPath => {
    const targetPath = path.join(asgardeoJsDir, relPath);
    patchFile(
      targetPath,
      [
        {
          search: "  if (options.instanceId) {\n    customStateValue = AUTH_INSTANCE_PREFIX + options.instanceId;\n  } else if (customParams) {\n    customStateValue = customParams[OIDCRequestConstants_default.Params.STATE]?.toString() ?? \"\";\n  }",
          replace: "  if (customParams && customParams[OIDCRequestConstants_default.Params.STATE]) {\n    customStateValue = customParams[OIDCRequestConstants_default.Params.STATE]?.toString() ?? \"\";\n  } else if (options.instanceId) {\n    customStateValue = AUTH_INSTANCE_PREFIX + options.instanceId;\n  }"
        }
      ],
      `@asgardeo/javascript/${relPath} (custom state preservation)`
    );
  });
} catch (err) {
  console.warn('[patch-asgardeo] Could not locate @asgardeo/javascript:', err.message);
}

// 8. server/actions/getClientOrigin.js - Respect NEXT_PUBLIC_APP_URL and x-forwarded-host
patchFile(
  path.join(asgardeoNextJsDir, 'server', 'actions', 'getClientOrigin.js'),
  [
    {
      search: "const host = headersList.get('host');\n    const protocol = headersList.get('x-forwarded-proto') ?? 'http';\n    return `${protocol}://${host}`;",
      replace: "if (process.env['NEXT_PUBLIC_APP_URL']) {\n        return process.env['NEXT_PUBLIC_APP_URL'].replace(/\\/$/, '');\n    }\n    const host = headersList.get('x-forwarded-host') || headersList.get('host');\n    const protocol = headersList.get('x-forwarded-proto') ?? 'https';\n    return `${protocol}://${host}`;"
    }
  ],
  'server getClientOrigin.js (x-forwarded-host / NEXT_PUBLIC_APP_URL)'
);

console.log('[patch-asgardeo] All patches applied successfully.');


