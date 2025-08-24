module.exports = {
  // Server configuration
  server: {
    port: process.env.PORT || 3001,
    host: process.env.HOST || 'localhost'
  },
  
  // Environment
  env: process.env.NODE_ENV || 'development',
  
  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
  },
  
  // Security
  security: {
    helmet: process.env.HELMET_ENABLED !== 'false'
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'combined'
  },
  
  // File paths
  files: {
    users: '../users.csv',
    reviews: '../reviews.csv'
  }
};

