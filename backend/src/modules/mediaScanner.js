const fs = require('fs/promises');
const path = require('path');
const { execFile } = require('child_process');
const db = require('../database');
const FFPROBE_PATH = path.join(__dirname, '..', '..', '..', 'bin', 'ffprobe.exe');
const SUPPORTED_EXTENSIONS = ['.mp4', '.mkv', '.avi', '.mov', '.webm'];

async function runLibraryScan() {
    console.log('[SCANNER] Starting library scan...');
    const libraryPaths = await db.getLibraryPaths();
    if (libraryPaths.length === 0) {
        console.log('[SCANNER] No library paths configured. Scan skipped.');
        return;
    }
    try {
        await fs.access(FFPROBE_PATH);
    } catch {
        console.error(`[SCANNER] CRITICAL ERROR: ffprobe.exe not found at the expected path: ${FFPROBE_PATH}`);
        console.error('[SCANNER] Cannot process media files. Halting scan.');
        return;
    }
    for (const library of libraryPaths) {
        await scanDirectory(library.path);
    }
    console.log('[SCANNER] Library scan finished.');
}
async function scanDirectory(directoryPath) {
    try {
        const entries = await fs.readdir(directoryPath, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(directoryPath, entry.name);
            if (entry.isDirectory()) {
                await scanDirectory(fullPath);
            } else if (SUPPORTED_EXTENSIONS.includes(path.extname(entry.name).toLowerCase())) {
                const existingFile = await db.getMediaByPath(fullPath);
                if (!existingFile) {
                    const duration = await getMediaDuration(fullPath);
                    if (duration) {
                        console.log(`[SCANNER] Indexing new file: ${entry.name}`);
                        await db.addMediaFile({ path: fullPath, fileName: entry.name, duration: duration });
                    }
                }
            }
        }
    } catch (error) {
        console.error(`[SCANNER] Error scanning directory ${directoryPath}. Please ensure the path is correct and accessible. Details:`, error.message);
    }
}
function getMediaDuration(filePath) {
    return new Promise((resolve) => {
        const args = ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', filePath];
        execFile(FFPROBE_PATH, args, (error, stdout, stderr) => {
            if (error) {
                console.error(`[FFPROBE] Error probing ${filePath}:`, stderr);
                resolve(null);
                return;
            }
            resolve(parseFloat(stdout));
        });
    });
}
module.exports = { runLibraryScan };