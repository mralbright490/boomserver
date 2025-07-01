const fastify = require('fastify')({ logger: true });
const path = require('path');
const db = require('./database');
const scanner = require('./modules/mediaScanner');

fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, '..', '..', 'frontend', 'dist'),
  prefix: '/',
});

fastify.setNotFoundHandler((req, reply) => {
  if (!req.raw.url.startsWith('/api')) {
    return reply.sendFile('index.html');
  }
  reply.code(404).send({ message: 'API route not found' });
});

fastify.register(require('@fastify/cors'), { 
  prefix: '/api',
  methods: ['GET', 'POST', 'DELETE', 'PUT'] 
});

fastify.get('/api/library/paths', async () => db.getLibraryPaths());
fastify.post('/api/library/paths', async (req) => db.addLibraryPath(req.body.path));
fastify.delete('/api/library/paths/:id', async (req) => db.deleteLibraryPath(req.params.id));

fastify.post('/api/library/scan', (req, reply) => {
  scanner.runLibraryScan();
  return { message: 'Library scan initiated.' };
});

fastify.delete('/api/library/purge', async () => db.purgeMediaStore());

fastify.get('/api/media', async () => db.getMediaFiles());
fastify.put('/api/media/:id', async (req) => db.updateMediaFile(req.params.id, req.body));
fastify.delete('/api/media/:id', async (req) => db.deleteMediaFile(req.params.id));

// NEW: Shutdown endpoint
fastify.post('/api/shutdown', async (req, reply) => {
    fastify.log.info('Received shutdown request. Shutting down server...');
    reply.send({ message: 'Shutting down BoomServer.' });
    // Give the response a moment to send before exiting
    setTimeout(() => {
        process.exit(0); // Gracefully exit the Node.js process
    }, 500); 
});


const start = async () => {
  try {
    db.initialize();
    await fastify.listen({ port: 8000, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();