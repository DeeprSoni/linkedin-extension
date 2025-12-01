#!/bin/bash
  cd /root/linkedin-agent
  export NODE_ENV=production
  export PORT=3000
  export MONGODB_URI="mongodb://admin:ds06bb01*@localhost:27017/linkedin_agent?authSource=admin"
  export REDIS_HOST=localhost
  export REDIS_PORT=6379
  export REDIS_PASSWORD=ds06bb01*
  export JWT_SECRET=j8K3mN2pQ9vR5xT7zY4wA1bC6dE0fG
  export JWT_EXPIRES_IN=30d
  export STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
  export STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
  export FRONTEND_URL=chrome-extension://your_extension_id_here
  cd backend && npx ts-node src/index.ts
  EOF
  #!/bin/bash
  cd /root/linkedin-agent
  export NODE_ENV=production
  export PORT=3000
  export MONGODB_URI="mongodb://admin:ds06bb01*@localhost:27017/linkedin_agent?authSource=admin"
  export REDIS_HOST=localhost
  export REDIS_PORT=6379
  export REDIS_PASSWORD=ds06bb01*
  export JWT_SECRET=j8K3mN2pQ9vR5xT7zY4wA1bC6dE0fG
  export JWT_EXPIRES_IN=30d
  export STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
  export STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
  export FRONTEND_URL=chrome-extension://your_extension_id_here
  cd backend && npx ts-node src/index.ts
