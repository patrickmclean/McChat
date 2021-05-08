const express = require('express');
const app = express();

const logger = require('./logger');
const rh = require("./responsehandler");
const ps = require('./pubsub');


// set location for js, css etc
app.use(express.static('client'));
app.use(express.json())

// host the index page
app.get('/index.html', function (req, res) {
   logger.write('get','called',2);
   res.sendFile( __dirname + "/" + "index.html" );
})

// process new message
app.post('/newmsg', function(req, res) {
   logger.write('newmsg','called',2);
   logger.write('content',req);
   rh.newMessage(req.body)
   // response handler - send message to db
   res.send({ "return": "return message" });
   //res.sendStatus(200);
   // add error conditions
});

// get image list
app.get('/loadhistory', function(req, res){
   logger.write('loadhistory','called',2);
   rh.loadHistory()
   .then(result => {
      logger.write('loadhistory','returned',2);
      res.send(JSON.stringify(result));
   })
   // add error conditions
})


/*
// process file download
// this is currently broken since it is downloading files
// where it should be parsing json
app.post('/process', function(req,res){
   logger.write('process','called',2);
   if (!req.body) {
      return res.status(400).send('No files were sent');
    }
    rh.processFiles(req.body);
    res.sendStatus(200);
})



// process delete image
app.post('/deleteimage', function(req,res){
   logger.write('deleteimage',req.body.filename,2)
   rh.deleteImage(req.body);
   res.sendStatus(200);
   // add error conditions
})

// return the set of image processing options available
app.get('/loadprocessingoptions', function(req,res){
   logger.write('loadprocoptions','',2);
   const options = rh.loadProcessingOptions();
   logger.write('loadprocoptions','returned',2);
   res.send(JSON.stringify(options));
   //add error conditions
})

// Stub for processing output complete (deepart case)
app.post('/outputcomplete', function(req,res){
   logger.write('output complete',req.body.filename,2)
   // make a db entry
   // make a thumbnail
   // notify the front end
   res.sendStatus(200)
})
*/

// Prep server side event stream for sending async refresh updates
app.get('/serverstream', (req, res) => {
   logger.write('serverstream','launch',2);
   let responseJSON = "";
   res.setHeader('Cache-Control', 'no-cache');
   res.setHeader('Content-Type', 'text/event-stream');
   res.setHeader("Access-Control-Allow-Origin", "*");
   res.flushHeaders(); // flush the headers to establish SSE with client

   let sub = ps.subscribe('grp1', function(obj) {   // Next - genericize the group setting
      logger.write('serverstream listener uploads',obj.message,2);
      responseJSON = JSON.stringify({"type": "refresh",obj});
      res.write(`data: ${responseJSON}\n\n`);   
      
   });
   
   // If client closes connection, stop sending events
   res.on('close', () => {
       logger.write('serverstream','client dropped connection',2);
       sub.remove();
       res.end();
   });
   
});


// The server itself
var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port
   console.log("App listening at http://%s:%s", host, port)
   logger.write('app','launched',1);
})