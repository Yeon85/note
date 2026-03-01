export function notFoundHandler(req, res) {
  res.status(404).json({ message: '요청한 경로를 찾을 수 없습니다.' });
}

export function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;
  const message = error.message || '서버 오류가 발생했습니다.';
  if (process.env.NODE_ENV !== 'test') {
    // eslint-disable-next-line no-console
    console.error(error);
  }
  res.status(statusCode).json({ message });
}
