// PM2 Ecosystem Config — 项目根目录
// 使用: pm2 start ecosystem.config.cjs  /  pm2 restart ecosystem.config.cjs

module.exports = {
  apps: [
    {
      name: 'nexious-api',
      cwd: './backend',
      script: 'dist/main.js',

      // 内存超过 300MB 自动重启 (512MB 机器需保守)
      max_memory_restart: '300M',

      // 生产环境
      env: {
        NODE_ENV: 'production',
      },

      // 日志 (最长保留 30 天)
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,
      max_size: '10M',
      retain: 30,

      // 崩溃自动重启
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,

      // 优雅关闭: 给 10 秒处理完当前请求
      kill_timeout: 10000,
      wait_ready: false,
      listen_timeout: 5000,
    },
  ],
};
