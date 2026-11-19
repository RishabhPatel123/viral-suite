// api/_crypto.js - Cryptographic token signer and anti-tamper verifier
const crypto = require('crypto');

const SECRET_KEY = process.env.APP_SECRET || 'viral_suite_super_secret_tamper_shield_2026';

function signToken(payload) {
  const jsonStr = JSON.stringify(payload);
  const dataB64 = Buffer.from(jsonStr).toString('base64url');
  const hmac = crypto.createHmac('sha256', SECRET_KEY).update(dataB64).digest('base64url');
  return `${dataB64}.${hmac}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [dataB64, providedHmac] = parts;
  const expectedHmac = crypto.createHmac('sha256', SECRET_KEY).update(dataB64).digest('base64url');

  const bufProvided = Buffer.from(providedHmac);
  const bufExpected = Buffer.from(expectedHmac);

  if (bufProvided.length !== bufExpected.length) {
    return null;
  }

  if (crypto.timingSafeEqual(bufProvided, bufExpected)) {
    try {
      const decodedJson = Buffer.from(dataB64, 'base64url').toString('utf8');
      return JSON.parse(decodedJson);
    } catch (e) {
      return null;
    }
  }
  return null;
}

module.exports = {
  signToken,
  verifyToken
};
