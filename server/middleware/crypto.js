import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16

function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'iborcuha-default-encryption-key!'
  // Ensure key is exactly 32 bytes for AES-256
  return crypto.createHash('sha256').update(key).digest()
}

/**
 * Encrypt a string value. Returns base64-encoded ciphertext.
 * Format: iv:authTag:ciphertext (all base64)
 */
export function encrypt(text) {
  if (!text) return ''
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(text, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  const authTag = cipher.getAuthTag()
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`
}

/**
 * Decrypt a string value encrypted with encrypt().
 */
export function decrypt(encryptedText) {
  if (!encryptedText) return ''
  try {
    const parts = encryptedText.split(':')
    if (parts.length !== 3) {
      // Might be a plain text password (migration compat)
      return encryptedText
    }
    const [ivB64, authTagB64, cipherB64] = parts
    const key = getEncryptionKey()
    const iv = Buffer.from(ivB64, 'base64')
    const authTag = Buffer.from(authTagB64, 'base64')
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)
    let decrypted = decipher.update(cipherB64, 'base64', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch {
    // If decryption fails, return original (may be plain text before migration)
    return encryptedText
  }
}
