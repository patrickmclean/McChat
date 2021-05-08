// Entry point for local filesystem scanner
// Reads all files under root directory
// For all image files that have not been previously indexed
// Creates index and uploads to Amazon DDB and Algolia
// Creates thumbnails and uploads to S3
// Creates local index

const fs = require('fs');
const util = require('util');
const bfs = require('./browsefs');
const awsddb = require('./awsdynamodb');
const logger = require('./logger.js');
const config = require('./config/config.js');
const algolia = require('./algolia');
const ps = require('./pubsub');
const threadCounter = require('./threadcounter');
const asyncLimit = require('./asynclimit');

const readFile = asyncLimit(util.promisify(fs.readFile),config.async_limit);
const stat = asyncLimit(util.promisify(fs.stat),config.async_limit);
const readDir = asyncLimit(util.promisify(fs.readdir),config.async_limit);

logger.create();
threadCounter.create();

// Read index file if it's there or create a new one if not, same for thumbnail directory
bfs.setRootDirectory(config.root_directory);

if (bfs.indexFile.exists()) {
  bfs.indexFile.readFile();
} else {
  bfs.indexFile.create();
}
if (!bfs.thumbnailDirectory.exists()) {
  bfs.thumbnailDirectory.create();
}

// Iterate through all the files in the root directory and upload
iterateDirectory(bfs.rootDirectory);

function iterateDirectory(dir) {
    readDir(dir)
    .then(list => {
        var pending = list.length;
        if (!pending) return null;
        list.forEach(function(file) {
            logger.write('Processing file',dir+'/'+file,1);
            file = path.resolve(dir, file);
            stat(file) // what type of file is it
            .then(stat => {
                logger.write('stat returned',file,2);
                if (stat && stat.isDirectory()) { 
                    if(path.basename(file).charAt(0) != "."){ // ignore hidden files
                        iterateDirectory(file);
                    } else {
                        if (!--pending) return null;
                        } 
                } else {
                    if (path.extname(file).match('jpg|JPG|png|PNG')) {
                        processImageFile(file,dir,stat);  // commented out just for debugging
                    }
                    if (!--pending) return null;
                }
            })
            .catch(err => {console.log(err)}); // catch stat
        })
    })
    .catch(err => {console.log(err)}); // catch readDir
}


// For each image file found
// * Create hash
// * Check hash against index file to see if it's new
// * If new
// ** Add to DB and Index
// ** Create and upload thumbnail


async function processImageFile(file,dir,stat) {
    var image = new bfs.imageClass;
    image.addFileInfo(file,dir,bfs.rootDirectory);
    image.addDate(stat.birthtime);
    logger.write('processImageFile', image.filename,1);

    /* read file and create hash */    
    readFile(file)
        .then(data => {
            bfs.checksum(data)
                .then(result => {
                    image.md5=result;
                    logger.write('md5 create',image.md5,2);
                    if (bfs.indexFile.includesMatch(image.md5) == -1) {
                        logger.write('Detected as new file', image.filename,2);
                        awsddb.insert(image);
                        algolia.addObject(image);
                        bfs.indexFile.addLine(image.folder+','+image.filename+','+image.md5+'\n');
                        bfs.createThumbnail(file,image,bfs.thumbnailDirectory.directoryName); // this also saves it locally and uploads it to s3
                    } 
                })
                .catch(err => {console.log(err)}); // catch checksum
        })
        .catch(err => {console.log(err)}) // catch readFile
}


