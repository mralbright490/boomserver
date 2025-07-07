const path = require('path');
const fs = require('fs');
const os = require('os');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const DATA_DIR = path.join(os.homedir(), 'AppData', 'Roaming', 'BoomServer');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'library.db.json');
const adapter = new FileSync(DB_PATH);
const db = low(adapter);

function initialize() {
    // Ensure defaults are set to create the 'media_files' array if it doesn't exist
    db.defaults({ library_paths: [], media_files: [] }).write();
    console.log(`[DATABASE] Database ready at: ${DB_PATH}`);
}

const getLibraryPaths = () => db.get('library_paths').value();

const addLibraryPath = (path) => {
    const newPath = { id: Date.now(), path };
    db.get('library_paths').push(newPath).write();
    return newPath;
};

const deleteLibraryPath = (id) => {
    db.get('library_paths').remove({ id: parseInt(id) }).write();
    return { deleted: 1 };
};

const getMediaByPath = (filePath) => db.get('media_files').find({ path: filePath }).value();
// NEW: Function to get media by filename
const getMediaByFilename = (filename) => db.get('media_files').find({ fileName: filename }).value();

const addMediaFile = (file) => {
    const newFile = { 
        id: Date.now(), 
        ...file, 
        title: file.fileName, 
        summary: '',
        category: 'Uncategorized', 
        showName: '',
        season: '',
        episode: ''
    };
    db.get('media_files').push(newFile).write();
    return newFile;
};

const getMediaFiles = () => db.get('media_files').sortBy('file_name').value();

const updateMediaFile = (id, data) => {
    db.get('media_files')
      .find({ id: parseInt(id) })
      .assign({ 
          title: data.title, 
          summary: data.summary,
          category: data.category,
          showName: data.showName,
          season: data.season,
          episode: data.episode
        })
      .write();
    return { updated: 1 };
};

const deleteMediaFile = (id) => {
    db.get('media_files').remove({ id: parseInt(id) }).write();
    return { message: 'Media file removed from library.' };
};

const purgeMediaStore = async () => {
    // THE FIX: Use db.set to explicitly set 'media_files' to an empty array.
    db.set('media_files', []).write(); 
    console.log('[DATABASE] Media store has been purged.');
    return { message: 'Media library purged successfully.' };
};

module.exports = { 
    initialize, 
    getLibraryPaths, 
    addLibraryPath, 
    deleteLibraryPath, 
    getMediaByPath, 
    getMediaByFilename, // NEW: Export getMediaByFilename
    addMediaFile, 
    getMediaFiles, 
    updateMediaFile,
    deleteMediaFile,
    purgeMediaStore
};