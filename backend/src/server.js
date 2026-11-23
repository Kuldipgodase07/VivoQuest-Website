const app = require('./app');
const config = require('./config/env');
const logger = require('./config/logger');

const PORT = config.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`VivoQuest Healthcare Backend running on port ${PORT} [${config.NODE_ENV}]`);
});
