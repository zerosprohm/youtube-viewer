module.exports = {
  apps: [
    {
      name: 'youtube-viewer',
      script: 'pnpm',
      args: 'start',
      cwd: process.cwd(),
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      // ビルドが必要な場合の前処理
      pre_start: 'pnpm build'
    },
    {
      name: 'youtube-viewer-dev',
      script: 'pnpm',
      args: 'dev',
      cwd: process.cwd(),
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      }
    }
  ]
}; 