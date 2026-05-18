/** @type {import('expo/config').ExpoConfig} */
const fs = require('fs');
const path = require('path');
const appJson = require('./app.json');

function loadEnvFile() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return {};
  const out = {};
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const fileEnv = loadEnvFile();

function env(key) {
  return fileEnv[key] || process.env[key] || '';
}

module.exports = () => ({
  ...appJson.expo,
  extra: {
    ...appJson.expo.extra,
    EXPO_PUBLIC_SUPABASE_URL: env('EXPO_PUBLIC_SUPABASE_URL'),
    EXPO_PUBLIC_SUPABASE_ANON_KEY: env('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
  },
});
