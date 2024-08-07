import logger from './logger.js';

const errorHandler = (err, req, res, next) => {
  logger.error('Error:', err);
  res.status(500).send('Something broke!');
};

export default errorHandler;