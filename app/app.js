const express = require('express');
const exphbs = require('express-handlebars');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const path = require('path');
const ddb = require('./lib/awsdynamodb')
const logger = require('./lib/logger');
const rh = require('./lib/responsehandler');
const ps = require('./lib/pubsub')

logger.create();

// Auth related code
const authTokens = {};  

class userClass {
    constructor() {
        this.username;
        this.email;
        this.password;
        this.version = 1; // change this any time the object definition changes
    }

    addUser(username,email,password) {
        this.username = username;
        this.email = email;
        this.password = password;
    }
};

const getHashedPassword = (password) => {
    const sha256 = crypto.createHash('sha256');
    const hash = sha256.update(password).digest('base64');
    return hash;
}

const generateAuthToken = () => {
    return crypto.randomBytes(30).toString('hex');
}

// Set up express server with handlebars
const app = express();
app.engine('hbs', exphbs({
    extname: '.hbs',
    layoutsDir   : 'views/layouts',
    defaultLayout: 'main'
}));
app.set('view engine', 'hbs');
app.set('views', 'views'); // not sure what this does...
app.use(express.static(path.join(__dirname, 'client')));

// help decode form returns
app.use(bodyParser.urlencoded({ extended: true }));
//app.use(bodyParser.json());
app.use(express.json());
// help with cookie mgmt
app.use(cookieParser());

// Validate user before passing to page load
app.use((req, res, next) => {
    let authToken = req.cookies['AuthToken'];
    ddb.verifyToken(authToken)
    .then(result => {
        req.user = result;
        next();
    })
    .catch(err => {
        logger.write('verify token error ',err,1);
    })
});


// Page handlers
app.get('/', (req, res) => {
    res.render('home');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = getHashedPassword(password);

    /* Now write username and pwd check from db */
    ddb.verifyUser(username,hashedPassword)
    .then(result => {
        logger.write('vu return result ',result,2);
        if(result == 1) {
            let authToken = generateAuthToken();
            /* authTokens[authToken] = email; */
            ddb.writeToken(authToken, username)

            res.cookie('AuthToken', authToken);
            res.cookie('User',username);
            res.redirect('/chat');
        } else {
            res.render('login', {
                message: 'Invalid username or password',
                messageClass: 'alert-danger'
            });
        }
     })
     .catch(err => {
         logger.write('vu return error ',err,1);
     })

});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', (req, res) => {
    const { email, username, password, confirmPassword } = req.body;

    if (password === confirmPassword) {
        ddb.userExists(username)
            .then(result => {
                if (result == 1) {
                    res.render('register', {
                        message: 'User already registered.',
                        messageClass: 'alert-danger'
                    })
                } else {
                    let user = {
                        username: username,
                        email: email,
                        password: getHashedPassword(password)
                    } 
                    ddb.newUser(user);
                    res.render('login', {
                        message: 'Registration Complete. Please login to continue.',
                        messageClass: 'alert-success'
                    });
                }
            }) 
    } else {
        res.render('register', {
            message: 'Password does not match.',
            messageClass: 'alert-danger'
        });
    }
});

// This is the main application, which is a protected page
app.get('/chat', (req, res) => {
    if (req.user) {
        res.render('chat');
    } else {
        res.render('login', {
            message: 'Please login to continue',
            messageClass: 'alert-danger'
        });
    }
});

// load chat history
app.get('/loadhistory', function(req, res){
    logger.write('loadhistory','called',2);
    rh.loadHistory()
    .then(result => {
       logger.write('loadhistory','returned',2);
       res.send(JSON.stringify(result));
    })
    .catch(err => {
        logger.write('loadhistory error ',err,1);
    })
 });

 // process new message
app.post('/newmsg', function(req, res) {
    const { sdr, msg, grp } = req.body;
    logger.write('newmsg called',msg,2);
    rh.newMessage(req.body)
    res.send({ "return": "return message" });
    // add error conditions
 });

 // Server side event stream for sending async refresh updates
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
var server = app.listen(8082, function () {
    var host = server.address().address
    var port = server.address().port
    console.log("App listening at http://%s:%s", host, port)
    //logger.write('app','launched',1);
 })