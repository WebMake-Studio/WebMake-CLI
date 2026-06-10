const { logger } = require('../utils/logger');

module.exports = function deploy() {
    logger.warn('Deploy is not configured yet.');
    logger.info('Add a deploy target command here, or use your hosting provider CLI directly.');
};
