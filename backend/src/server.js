const fastify = require('fastify')({ logger: true });
const path = require('path');
const fs = require('fs');
const db = require('./database');
const scanner = require('./modules/mediaScanner');
const youtubeImporter = require('./modules/youtubeImporter');
const generator = require('./modules/generator');
const open = require('open');
const ytdl = require('@distube/ytdl-core');
const os = require('os'); // Required to find the network IP

// --- THIS IS THE NEW FUNCTION ---
// It finds the correct local network IP address of the machine running the server.
function getLocalIpAddress() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost'; // Fallback in case no IP is found
}


fastify.register(require('@fastify/static'), { root: path.join(__dirname, '..', '..', 'frontend', 'dist'), prefix: '/' });
fastify.setNotFoundHandler((req, reply) => { if (!req.raw.url.startsWith('/api')) { return reply.sendFile('index.html'); } reply.code(404).send({ message: 'API route not found' }); });
fastify.register(require('@fastify/cors'), { prefix: '/api', methods: ['GET', 'POST', 'DELETE', 'PUT'] });

// --- All API Routes remain the same ---
fastify.get('/api/library/paths', async () => db.getLibraryPaths());
fastify.post('/api/library/paths', async (req) => db.addLibraryPath(req.body.path));
fastify.delete('/api/library/paths/:id', async (req) => db.deleteLibraryPath(req.params.id));
fastify.post('/api/library/scan', (req, reply) => { scanner.runLibraryScan(); return { message: 'Library scan initiated.' }; });
fastify.delete('/api/library/purge', async () => db.purgeMediaStore());
fastify.get('/api/media', async () => db.getMediaFiles());
fastify.put('/api/media/:id', async (req) => db.updateMediaFile(req.params.id, req.body));
fastify.delete('/api/media/:id', async (req) => db.deleteMediaFile(req.params.id));
fastify.post('/api/media/bulk-update-category', async (req, reply) => { const { mediaIds, category } = req.body; if (!Array.isArray(mediaIds) || !category) { return reply.code(400).send({ message: 'mediaIds (array) and category (string) are required.' }); } const result = db.bulkUpdateCategory(mediaIds, category); return reply.send(result); });
fastify.post('/api/youtube', async (req, reply) => { const { url } = req.body; if (!url) { return reply.code(400).send({ message: 'URL is required' }); } const result = await youtubeImporter.processYouTubeUrl(url); if (result.success) { return reply.send(result); } return reply.code(500).send({ message: result.message }); });
fastify.get('/api/channels', async () => db.getChannels());
fastify.post('/api/channels', async (req) => db.addChannel(req.body));
fastify.delete('/api/channels/:id', async (req) => db.deleteChannel(req.params.id));
fastify.put('/api/channels/:id', async (req) => db.updateChannel(req.params.id, req.body));
fastify.get('/api/bomcast/ad-options', async () => db.getAdOptions());
fastify.post('/api/channels/:id/schedule', async (req, reply) => { const channelId = req.params.id; const { schedule } = req.body; if (!Array.isArray(schedule)) { return reply.code(400).send({ message: 'Schedule must be an array.' }); } const result = db.updateScheduleForChannel(channelId, schedule); return reply.send(result); });
fastify.post('/api/channels/:id/schedule/add', async (req, reply) => { const channelId = req.params.id; const { mediaId } = req.body; if (!mediaId) { return reply.code(400).send({ message: 'mediaId is required.' }); } const result = db.addMediaToChannelSchedule(channelId, mediaId); if (result.success) { return reply.send(result.item); } return reply.code(404).send({ message: result.message }); });
fastify.post('/api/channels/:id/schedule/add-bulk', async (req, reply) => { const channelId = req.params.id; const { mediaIds } = req.body; if (!Array.isArray(mediaIds)) { return reply.code(400).send({ message: 'mediaIds must be an array.' }); } const result = db.addMultipleMediaToChannelSchedule(channelId, mediaIds); return reply.send(result); });
fastify.post('/api/shutdown', async (req, reply) => { fastify.log.info('Received shutdown request. Shutting down server...'); reply.send({ message: 'Shutting down BoomServer.' }); setTimeout(() => process.exit(0), 500); });


// Public-Facing M3U, EPG, and Streaming Routes
fastify.get('/m3u/:channelId/:filename', (req, reply) => {
    const { channelId, filename } = req.params;
    // THE FIX: Use the machine's local IP address instead of 'localhost'
    const serverUrl = `${req.protocol}://${getLocalIpAddress()}:${fastify.server.address().port}`;
    const m3uContent = generator.generateM3U(serverUrl, channelId);
    reply.header('Content-Disposition', `attachment; filename="${filename}"`);
    reply.header('Content-Type', 'application/octet-stream');
    reply.send(m3uContent);
});

fastify.get('/epg.xml', (req, reply) => {
    const serverUrl = `${req.protocol}://${getLocalIpAddress()}:${fastify.server.address().port}`;
    const xmlContent = generator.generateXMLTV(serverUrl);
    reply.header('Content-Type', 'application/xml');
    reply.send(xmlContent);
});

fastify.get('/stream/:mediaId', (req, reply) => {
    const { mediaId } = req.params;
    const mediaItem = db.getMediaFiles().find(m => m.id === parseInt(mediaId));
    if (!mediaItem) { return reply.code(404).send({ message: "Media not found." }); }
    if (mediaItem.videoId) {
        try {
            const stream = ytdl(mediaItem.videoId, { quality: 'highest' });
            return reply.send(stream);
        } catch (error) {
            console.error(error);
            return reply.code(500).send({ message: "Failed to stream YouTube video." });
        }
    }
    if (fs.existsSync(mediaItem.path)) {
        const stream = fs.createReadStream(mediaItem.path);
        return reply.send(stream);
    }
    return reply.code(404).send({ message: "Local file not found at path." });
});

const start = async () => {
  try {
    const port = 8000;
    const host = '0.0.0.0'; // This makes the server accessible on your network
    db.initialize();
    await fastify.listen({ port, host });
    const listenAddress = `http://localhost:${port}`;
    fastify.log.info(`Server listening on ${listenAddress} and on your local network at http://${getLocalIpAddress()}:${port}`);
    await open(listenAddress);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();