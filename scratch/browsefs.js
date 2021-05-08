fs = require('fs');
path = require('path');
uuid = require('uuid');
crypto = require('crypto');
util = require('util');
imageThumbnail = require('image-thumbnail');
awss3 = require('../server/awss3.js');
logger = require('../server/logger.js');
imageSize = require('image-size');
config = require('./config/config.js');
asyncLimit = require('../server/asynclimit');

const readFile = asyncLimit(util.promisify(fs.readFile),config.asyncLimit);
const writeFile = asyncLimit(util.promisify(fs.writeFile),config.asyncLimit);


module.exports = {

    setRootDirectory: function (dirname) {
        this.rootDirectory = dirname;
        this.indexFile.filename = this.rootDirectory + '/.ibi';
        this.thumbnailDirectory.directoryName = this.rootDirectory + '/.thumbnails/'
    },

    indexFile: {
        exists: function (){
            try {
                return fs.existsSync(this.filename);
            } catch(err) {
                console.error(err);
            }
        },
        create: function () {
            try {
                fs.writeFileSync(this.filename,"#iBrowser Index File\n");
            } catch(err) {
                console.error(err);
            }
        },
        readFile: function() {
            try {
                this.contents = fs.readFileSync(this.filename,"utf8");
            } catch (error) {
                console.error('Index file read: '+error);
            }            
        },
        addLine: function(line) {
            try {
                fs.appendFileSync(this.filename,line,'utf8');
                logger.write('index add line','',2);
            } catch(err) {
                console.error(err);
            }
        },
        includesMatch: function (matchString) {
            return this.contents.indexOf(matchString);
        },
        filename: '',
        contents: ''
    },
    rootDirectory: String,
    thumbnailDirectory: {
        exists: function() {
            try {
                return fs.existsSync(this.directoryName);
            } catch(err) {
                console.error(err);
            }
        },
        create: function() {
            try {
                return fs.mkdirSync(this.directoryName);
            } catch(err) {
                console.error(err);
            }
        },
        directoryName: ''
    },

    createThumbnail: asyncLimit(function(file,image,thumbnailRoot) {
        that = this;
        return new Promise(async function (resolve, reject) {
            // create thumbnail for large images, just copy for small
            var dimensions = imageSize(file);
            if (dimensions.width > (image.thumbnailSize*2)) {
                var thumbnail = await imageThumbnail(file, { width: image.thumbnailSize, responseType: 'base64' });
                logger.write('thumbnail creation complete',image.filename,2);
                that.writeThumbnail(image, thumbnail,thumbnailRoot);
            } else {
                readFile(file, "base64")
                    .then(result => {
                        logger.write('thumbnail copy complete',image.filename,2);
                        that.writeThumbnail(image, result,thumbnailRoot);
                    })
                    .catch(err => {console.log(err)});
            }
        })
    }),
    
    writeThumbnail: asyncLimit(function(image, thumbnail,thumbnailRoot){
        return new Promise(function (resolve, reject) {
            var tbfilename = image.imageId+'.jpg';
            writeFile(thumbnailRoot+tbfilename, thumbnail, {encoding: 'base64'})
                .then(result => {logger.write('thumbnail write complete',tbfilename,2);})
                .catch(err => {console.log(err)})
            awss3.uploadThumbnail(image.imageId,thumbnail);
            logger.write('thumbnail upload complete',image.filename,2);
        })
    }),

    checksum: asyncLimit(function(str, algorithm, encoding) {
        return new Promise(function (resolve, reject) {
            resolve( crypto
                .createHash(algorithm || 'md5')
                .update(str, 'utf8')
                .digest(encoding || 'hex'))
        })
    },config.asyncLimit),

    imageClass: 
    class  {
        constructor() {
            this.imageId = uuid();
            this.date = {
                utc: '',
                year: '',
                month: '',
                day: ''
            }
            this.md5 = ''
            this.filename = ''
            this.folder = ''
            this.thumbnailSize = config.thumbnailSize;
        }
        addFileInfo(file, folder, rootDirectory) {
            this.filename = path.basename(file);
            this.folder =folder.replace(rootDirectory,'');
        }
        addDate(birthtime){
            this.date.utc = birthtime;
            this.date.year = birthtime.getUTCFullYear();
            this.date.month = birthtime.getUTCMonth()+1; /* months are zero based ! */
            this.date.day = birthtime.getUTCDay();
        }
    }    
}