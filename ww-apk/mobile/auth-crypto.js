var ENCRYPTION_KEY = 'whenwhere-2024-secret-key-32b';

async function _getKey() {
  var encoder = new TextEncoder();
  var keyData = encoder.encode(ENCRYPTION_KEY);
  var hashBuffer = await crypto.subtle.digest('SHA-256', keyData);
  return await crypto.subtle.importKey('raw', hashBuffer, { name: 'AES-CBC' }, false, ['encrypt', 'decrypt']);
}

async function encryptToken(token) {
  var key = await _getKey();
  var iv = crypto.getRandomValues(new Uint8Array(16));
  var encoder = new TextEncoder();
  var encrypted = await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, key, encoder.encode(token));
  var ivHex = Array.from(iv).map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
  var encHex = Array.from(new Uint8Array(encrypted)).map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
  return ivHex + ':' + encHex;
}

async function decryptToken(encryptedToken) {
  try {
    var parts = encryptedToken.split(':');
    if (parts.length !== 2) return null;
    var iv = new Uint8Array(parts[0].match(/.{2}/g).map(function(byte) { return parseInt(byte, 16); }));
    var encData = new Uint8Array(parts[1].match(/.{2}/g).map(function(byte) { return parseInt(byte, 16); }));
    var key = await _getKey();
    var decrypted = await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, key, encData);
    return new TextDecoder().decode(decrypted);
  } catch (e) {
    return null;
  }
}

async function hashToken(token) {
  var encoder = new TextEncoder();
  var data = encoder.encode(token);
  var hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
}

function generateToken() {
  var bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes).map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
}

var authCrypto = { encryptToken: encryptToken, decryptToken: decryptToken, hashToken: hashToken, generateToken: generateToken };
window.authCrypto = authCrypto;
