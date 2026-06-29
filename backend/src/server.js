"use strict"; function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }require('dotenv/config');
var _app = require('./app'); var _app2 = _interopRequireDefault(_app);
var _env = require('./config/env'); var _env2 = _interopRequireDefault(_env);
var _database = require('./config/database'); var _database2 = _interopRequireDefault(_database);
const { startAttendanceCron, stopAttendanceCron } = require('./shared/attendance.cron');

const PORT = _env2.default.port;

async function main() {
  try {
    // Test database connection
    await _database2.default.$connect();
    console.log('✅ Database connected successfully');

    const server = _app2.default.listen(PORT, () => {
      console.log(`🚀 Hoteloraa API Server running on port ${PORT}`);
      console.log(`📍 Environment: ${_env2.default.nodeEnv}`);
      console.log(`🌐 API Base URL: http://localhost:${PORT}/api/v1`);
      console.log(`💚 Health Check: http://localhost:${PORT}/api/v1/health`);
      // Start attendance auto-checkout cron
      startAttendanceCron();
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      stopAttendanceCron();
      server.close(async () => {
        await _database2.default.$disconnect();
        console.log('✅ Server and DB connection closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    await _database2.default.$disconnect();
    process.exit(1);
  }
}

main();
