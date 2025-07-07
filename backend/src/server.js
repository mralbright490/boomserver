const fastify = require('fastify')({ logger: true });
const path = require('path');
const db = require('./database');
const scanner = require('./modules/mediaScanner');
const scheduleManager = require('./modules/scheduleManager');
const os = require('os');

const BOMCAST_DATA_DIR = path.join(os.homedir(), 'AppData', 'Roaming', 'BomCast');

fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, '..', '..', 'frontend', 'dist'),
  prefix: '/',
});

fastify.register(require('@fastify/static'), {
    root: BOMCAST_DATA_DIR,
    prefix: '/bomcast_playlists/',
    decorateReply: false
});

fastify.register(require('@fastify/static'), {
    root: BOMCAST_DATA_DIR,
    prefix: '/bomcast_epgs/',
    decorateReply: false
});

// MODIFIED: Route to serve actual media files - Added 'return' before reply.sendFile
fastify.get('/media/:filename', async (req, reply) => {
    const filename = req.params.filename;
    const mediaFile = db.getMediaByFilename(filename);

    if (mediaFile && mediaFile.path) {
        console.log(`[MEDIA SERVER] Attempting to serve: ${mediaFile.path}`);
        try {
            return reply.sendFile(path.basename(mediaFile.path), path.dirname(mediaFile.path)); // FIX: Added 'return'
        } catch (error) {
            console.error(`[MEDIA SERVER] Error serving file ${mediaFile.path}:`, error.message);
            if (error.code === 'ENOENT') {
                reply.code(404).send('Media file not found on disk.');
            } else if (error.code === 'EACCES') {
                reply.code(403).send('Permission denied to access media file.');
            } else {
                reply.code(500).send('Error serving media file.');
            }
        }
    } else {
        console.warn(`[MEDIA SERVER] File not found in DB for request: ${filename}`);
        reply.code(404).send('Media file not found in database.');
    }
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

// BoomServer API Endpoints
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

// BomCast API Endpoints
fastify.get('/api/bomcast/schedule', async () => scheduleManager.getSchedule());
fastify.post('/api/bomcast/schedule', async (req) => scheduleManager.addScheduledItem(req.body));
fastify.put('/api/bomcast/schedule/:id', async (req) => scheduleManager.updateScheduledItem(req.params.id, req.body));
fastify.post('/api/bomcast/schedule/shuffle', async () => scheduleManager.shuffleSchedule());
fastify.delete('/api/bomcast/schedule/:id', async (req) => scheduleManager.removeScheduledItem(req.params.id));
fastify.delete('/api/bomcast/schedule/all', async () => scheduleManager.clearSchedule());
fastify.get('/api/bomcast/ad-options', async () => scheduleManager.getAdOptions());
fastify.put('/api/bomcast/ad-options', async (req) => scheduleManager.updateAdOptions(req.body));
fastify.post('/api/bomcast/generate-m3u', async () => scheduleManager.generateM3U());
fastify.post('/api/bomcast/generate-epg', async () => scheduleManager.generateEPG());

fastify.post('/api/shutdown', async (req, reply) => {
    fastify.log.info('Received shutdown request. Shutting down server...');
    reply.send({ message: 'Shutting down BoomServer.' });
    setTimeout(() => {
        process.exit(0);
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