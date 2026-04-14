// Input validation helpers for routes

export function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') return false
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 10 && digits.length <= 15
}

export function validatePassword(password) {
  if (!password || typeof password !== 'string') return false
  return password.length >= 6 && password.length <= 128
}

export function validateName(name) {
  if (!name || typeof name !== 'string') return false
  const trimmed = name.trim()
  return trimmed.length >= 1 && trimmed.length <= 255
}

export function validateAmount(amount) {
  if (amount === undefined || amount === null) return false
  const num = Number(amount)
  return !isNaN(num) && num > 0 && num <= 99999999
}

export function validateId(id) {
  if (!id || typeof id !== 'string') return false
  return /^[a-zA-Z0-9_-]{1,64}$/.test(id)
}

export function validateDate(date) {
  if (!date || typeof date !== 'string') return false
  return !isNaN(Date.parse(date))
}

export function validateUrl(url) {
  if (!url || typeof url !== 'string') return false
  try {
    new URL(url)
    return true
  } catch {
    return /^\/uploads\/[a-zA-Z0-9._-]+$/.test(url) // Allow local upload paths
  }
}

// Middleware factory for required fields
export function requireFields(...fields) {
  return (req, res, next) => {
    const missing = fields.filter(f => !req.body[f] && req.body[f] !== 0 && req.body[f] !== false)
    if (missing.length > 0) {
      return res.status(400).json({
        error: `Отсутствуют обязательные поля: ${missing.join(', ')}`
      })
    }
    next()
  }
}
