# McChat
# Open Source Chat Solution independent of funky actors

# Where is node?
Node.js v14.16.1 to /usr/local/bin/node
npm v6.14.12 to /usr/local/bin/npm

# To install locally
Install node from macos installer
npm install express
npm install aws-sdk
npm install uuid
npm install path

# To install on server
Login to AWS Server
If cleaning up first: rm -rf * 
First time: git clone https://github.com/patrickmclean/mcchat.git
ftp the config file over
run: cd to app directory

# To allow the server to run https on port 443 
sudo setcap 'cap_net_bind_service=+ep' ~/.nvm/versions/node/v14.14.0/bin/node

# Download the latest (need to move config out of the way due to .gitignore, must be a better way)
mv config ..
git pull
mv ../config .

restart the app:
ps -aux to get the process number
kill -9 PID
node app.js &
Application is running on X.X.X.X:8082


Authentication approach based on 
https://stackabuse.com/handling-authentication-in-express-js/
npm install express-handlebars
npm install body-parser cookie-parser

#whats next



# To run locally
node ./server/main.js
http://localhost:8082


# Setting up a new server on ec2
Install nvm: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
Activate nvm: . ~/.nvm/nvm.sh
Install node: nvm install node
Install express: npm install express (what's the difference nvm, npm!)
Install aws-sdk: npm install aws-sdk



