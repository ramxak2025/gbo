// Global error handler middleware
export function errorHandler(err, req, res, _next) {
  // Log error for server-side debugging
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message)
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack)
  }

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Файл слишком большой. Максимум 10MB.' })
  }

  // Multer other errors
  if (err.name === 'MulterError') {
    return res.status(400).json({ error: `Ошибка загрузки: ${err.message}` })
  }

  // Validation errors
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Некорректный JSON в запросе' })
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Ошибка авторизации' })
  }

  // Default server error
  const status = err.status || err.statusCode || 500
  const message = status === 500 ? 'Внутренняя ошибка сервера' : err.message

  res.status(status).json({ error: message })
}

// Async route wrapper — catches async errors and passes to errorHandler
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
