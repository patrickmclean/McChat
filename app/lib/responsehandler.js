const ddb = require('./awsdynamodb');
const aws = require('aws-sdk');
const uuid = require('uuid');

const ps = require('./pubsub');
const logger = require('./logger');
const config = require('../config/config.js');



module.exports = {

    messageClass: class {
        constructor() {
            this.item = uuid.v4();
            this.utc;
            this.date = {};
            this.sender;
            this.message;
            this.group = '';
            this.version = 1; // change this any time the object definition changes
        }
    
        addDate() {
            let current = new Date();
            this.utc = current.getTime();
            this.date.year = current.getUTCFullYear();
            this.date.month = current.getUTCMonth() + 1; /* months are zero based ! */
            this.date.day = current.getUTCDate();
            this.date.hour = current.getUTCHours();
            this.date.minutes = current.getUTCMinutes();
            this.date.seconds = current.getUTCSeconds();
        }

        addMessage(sender,message,group) {
            this.addDate();
            this.sender = sender;
            this.message = message;
            this.group = group;
        }
    },
    
    newMessage: function(data){
        logger.write('new message',data.msg,2);
        let messageItem = new this.messageClass;
        messageItem.addMessage(data.sdr,data.msg,data.grp);
        ddb.insert(messageItem);
        ps.publish('grp'+data.grp,messageItem);
    },

    loadHistory: async function() { // this should be keyed off group, and validated for user access
        logger.write('loadHistory','enter',2);
        let data = await ddb.readAll();
        logger.write('loadHistory', 'data back',2);
        return data;
    }
}

