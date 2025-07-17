const fastify = require('fastify')({ logger: true });
const path = require('path');
const db = require('./database');
const scanner = require('./modules/mediaScanner');
const youtubeImporter = require('./modules/youtubeImporter');
const open = require('open');

fastify.register(require('@fastify/static'), { root: path.join(__dirname, '..', '..', 'frontend', 'dist'), prefix: '/' });
fastify.setNotFoundHandler((req, reply) => { if (!req.raw.url.startsWith('/api')) { return reply.sendFile('index.html'); } reply.code(404).send({ message: 'API route not found' }); });
fastify.register(require('@fastify/cors'), { prefix: '/api', methods: ['GET', 'POST', 'DELETE', 'PUT'] });

// Library & Media Routes
fastify.get('/api/library/paths', async () => db.getLibraryPaths());
fastify.post('/api/library/paths', async (req) => db.addLibraryPath(req.body.path));
fastify.post('/api/library/scan', (req, reply) => { scanner.runLibraryScan(); return { message: 'Library scan initiated.' }; });
fastify.get('/api/media', async () => db.getMediaFiles());
fastify.put('/api/media/:id', async (req) => db.updateMediaFile(req.params.id, req.body));
fastify.post('/api/youtube', async (req, reply) => { const { url } = req.body; if (!url) { return reply.code(400).send({ message: 'URL is required' }); } const result = await youtubeImporter.processYouTubeUrl(url); if (result.success) { return reply.send(result); } return reply.code(500).send({ message: result.message }); });

// NEW: Route to bulk update media categories
fastify.post('/api/media/bulk-update-category', async (req, reply) => {
    const { mediaIds, category } = req.body;
    if (!Array.isArray(mediaIds) || !category) {
        return reply.code(400).send({ message: 'mediaIds (array) and category (string) are required.' });
    }
    const result = db.bulkUpdateCategory(mediaIds, category);
    return reply.send(result);
});

// Channel & Schedule Routes
fastify.get('/api/channels', async () => db.getChannels());
fastify.post('/api/channels', async (req) => db.addChannel(req.body));
fastify.put('/api/channels/:id', async (req) => db.updateChannel(req.params.id, req.body));
fastify.delete('/api/channels/:id', async (req) => db.deleteChannel(req.params.id));
fastify.post('/api/channels/:id/schedule', async (req, reply) => { const result = db.updateScheduleForChannel(req.params.id, req.body.schedule); return reply.send(result); });
fastify.post('/api/channels/:id/schedule/add', async (req, reply) => { const channelId = req.params.id; const { mediaId } = req.body; if (!mediaId) { return reply.code(400).send({ message: 'mediaId is required.' }); } const result = db.addMediaToChannelSchedule(channelId, mediaId); if (result.success) { return reply.send(result.item); } return reply.code(404).send({ message: result.message }); });

// NEW: Route to add multiple items to a channel's schedule
fastify.post('/api/channels/:id/schedule/add-bulk', async (req, reply) => {
    const channelId = req.params.id;
    const { mediaIds } = req.body;
    if (!Array.isArray(mediaIds)) {
        return reply.code(400).send({ message: 'mediaIds must be an array.' });
    }
    const result = db.addMultipleMediaToChannelSchedule(channelId, mediaIds);
    return reply.send(result);
});


const start = async () => {
  try {
    const port = 8000;
    const host = '0.0.0.0';
    db.initialize();
    await fastify.listen({ port, host });
    const listenAddress = `http://localhost:${port}`;
    fastify.log.info(`Server listening on ${listenAddress}`);
    await open(listenAddress);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();