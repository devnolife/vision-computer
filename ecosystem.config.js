module.exports = {
  apps: [
    // ═══════════════════════════════════════════════════════════════════
    // BACKEND SERVICES
    // ═══════════════════════════════════════════════════════════════════
    {
      name: 'redis',
      script: 'redis-server',
      args: '--dir /workspaces/vision-computer --logfile /workspaces/vision-computer/backend/logs/redis.log',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 1000,
      env: {
        NODE_ENV: 'development'
      }
    },
    {
      name: 'fastapi',
      script: 'gunicorn',
      args: 'app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 --timeout 300 --keep-alive 5 --log-level info',
      cwd: '/workspaces/vision-computer/backend',
      interpreter: 'none',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 2000,
      env: {
        NODE_ENV: 'development',
        PYTHONPATH: '/workspaces/vision-computer/backend'
      }
    },
    {
      name: 'celery-worker',
      script: 'celery',
      args: '-A app.celery_app worker --loglevel=info --concurrency=4 --pool=prefork --queues=unified,analysis,matching,bypass --max-tasks-per-child=10 --time-limit=600 --soft-time-limit=540',
      cwd: '/workspaces/vision-computer/backend',
      interpreter: 'none',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 3000,
      env: {
        NODE_ENV: 'development',
        PYTHONPATH: '/workspaces/vision-computer/backend'
      }
    },
    // ═══════════════════════════════════════════════════════════════════
    // FRONTEND SERVICE
    // ═══════════════════════════════════════════════════════════════════
    {
      name: 'frontend',
      script: 'npm',
      args: 'run dev',
      cwd: '/workspaces/vision-computer/frontend',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 2000,
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      }
    }
  ]
};
