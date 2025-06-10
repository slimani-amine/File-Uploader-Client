interface EnvConfig {
  apiUrl: string;
  apiTimeout: number;
  maxFileSize: number;
  allowedFileTypes: string[];
  maxConcurrentUploads: number;
  enableAnalytics: boolean;
  enableLogging: boolean;
  nodeEnv: 'development' | 'production' | 'test';
}

const config: EnvConfig = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  apiTimeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  maxFileSize: Number(import.meta.env.VITE_MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  allowedFileTypes: (import.meta.env.VITE_ALLOWED_FILE_TYPES || 'image/jpeg,image/png,application/pdf').split(','),
  maxConcurrentUploads: Number(import.meta.env.VITE_MAX_CONCURRENT_UPLOADS) || 3,
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  enableLogging: import.meta.env.VITE_ENABLE_LOGGING !== 'false',
  nodeEnv: (import.meta.env.VITE_NODE_ENV || 'development') as EnvConfig['nodeEnv'],
};

export const validateConfig = () => {
  const requiredVars = ['VITE_API_URL'] as const;
  const missingVars = requiredVars.filter(
    (envVar) => !import.meta.env[envVar]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }
};

export default config; 