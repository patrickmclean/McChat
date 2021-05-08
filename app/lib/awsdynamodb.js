// Manage all database access

// AWS config update is called for every call
// Likely not efficient, add some session state at some point

const AWS = require('aws-sdk');
const config = require('../config/config.js');
const logger = require('./logger.js');

module.exports = {
  // Chat items
  insert: function(item){
    logger.write('aws ddb insert', item.message,2);

    AWS.config.update(config.aws_remote_config);

    const docClient = new AWS.DynamoDB.DocumentClient();
    
    const params = {
      TableName: config.aws_table_name,
      Item: item
    };
    
    docClient.put(params, function(err, data) {
      if (err) {
          console.log('Error: Server error: '+err);
      } else {
        const { Items } = data;
      }
    });
  },

  delete: async function(item){
    logger.write('aws ddb ', 'delete: '+item.filename,2);

    AWS.config.update(config.aws_remote_config);

    const ddb = new AWS.DynamoDB;
    
    const params = {
      TableName: config.aws_table_name,
      Key: {'item': {S: item.item}}
    };
    
    ddb.deleteItem(params, function(err, data) {
      if (err) {
          logger.write('awsddb', 'ddb delete err '+err,1);
      } else {
        logger.write('awsddb', 'ddb delete success '+data,2);
        const { Items } = data;
      }
    });
  },
  
  readAll: async function() {
    logger.write('ddb','readAll',3);
    AWS.config.update(config.aws_remote_config);
    let docClient = new AWS.DynamoDB.DocumentClient();
    let params = {
        TableName: config.aws_table_name,
        Limit: 10, // max return values - replace this with filtering 
        ScanIndexForward: false, // true = ascending, false = descending
        KeyConditionExpression: '#g = :groupnum AND #u >= :starttime',  
        ExpressionAttributeNames: {
          "#g" : "group",
          "#u": "utc",
        },
        ExpressionAttributeValues: {
          ":groupnum": "1" , // dynamic at future date
          ":starttime": 1619969263251,
        }
    };
    let promise = docClient.query(params).promise();  // was scan
    let result = await promise;
    let data = result.Items.reverse();
    
    data.forEach(element => {
      logger.write('ddbreadAllresult',element.message,3);
    });
    return data;
    },

    // User table items
    newUser: function(userItem){
      logger.write('aws ddb new user', userItem.message,2);
  
      AWS.config.update(config.aws_remote_config);
  
      const docClient = new AWS.DynamoDB.DocumentClient();
      
      const params = {
        TableName: config.aws_users_table,
        Item: userItem
      };
      
      docClient.put(params, function(err, data) {
        if (err) {
            console.log('Error: Server error: '+err);
        } else {
          const { Items } = data;
        }
      });
    },

    userExists: async function(username) {
      logger.write('ddb','findUser '+username,3);
      AWS.config.update(config.aws_remote_config);
      let docClient = new AWS.DynamoDB.DocumentClient();
      let params = {
          TableName: config.aws_users_table,
          KeyConditionExpression: '#u = :user',  
          ExpressionAttributeNames: {
            "#u": "username",
          },
          ExpressionAttributeValues: {
            ":user": username , 
          }
      };
      let promise = docClient.query(params).promise();  
      let result;
      try {
        result = await promise;
        logger.write('result of user exists db query',result.Count,2);
      } catch(err) {
        logger.write('error in user exists db query ',err,1);
      }
      return result.Count;
    },

    verifyUser: async function(username, password) {
      logger.write('ddb','verifyUser '+username,3);
      AWS.config.update(config.aws_remote_config);
      let docClient = new AWS.DynamoDB.DocumentClient();
      let params = {
          TableName: config.aws_users_table,
          KeyConditionExpression: '#u = :user',  
          FilterExpression: '#p = :pwd', // you can only use AND if the item is in the index
          ExpressionAttributeNames: {
            "#u": "username",
            "#p": "password"
          },
          ExpressionAttributeValues: {
            ":user": username,
            ":pwd": password 
          }
      };
      let promise = docClient.query(params).promise();  
      try {
        var result = await promise;
        logger.write('result of verify user db query',result.Count,2);
      } catch(err) {
        logger.write('error in verify user db query ',err,1);
      }
      return result.Count;
    },

    writeToken: function (authtoken, username) {
      logger.write('aws ddb new token', authtoken,2);
  
      AWS.config.update(config.aws_remote_config);
      const docClient = new AWS.DynamoDB.DocumentClient();
      const params = {
        TableName: config.aws_token_table,
        Item: {
          authToken: authtoken,
          username: username
        }
      };
      
      docClient.put(params, function(err, data) {
        if (err) {
            console.log('Error: Server error: '+err);
        } else {
          const { Items } = data;
        }
      });
    },

    verifyToken: async function (token){
      logger.write('ddb','verifyToken'+token,3);
      AWS.config.update(config.aws_remote_config);
      let docClient = new AWS.DynamoDB.DocumentClient();
      let params = {
          TableName: config.aws_token_table,
          KeyConditionExpression: '#t = :token',  
          ExpressionAttributeNames: {
            "#t": "authToken",
          },
          ExpressionAttributeValues: {
            ":token": token 
          }
      };
      let promise = docClient.query(params).promise();  
      let username = null;
      try {
        var result = await promise;
        logger.write('result of verify token db query',result.Count,2);
        if (result.Count == 1){
          username = result.Items[0].username;
        } 
      } catch(err) {
        logger.write('error in verify token db query ',err,1);
      }
      return username;
    }
}
