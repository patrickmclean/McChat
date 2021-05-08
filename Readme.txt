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
First time: git clone https://github.com/patrickmclean/mcchat.git
ftp the config file over
run: cd to app directory


Experimental for login
Based on
https://stackabuse.com/handling-authentication-in-express-js/
npm install express-handlebars
npm install body-parser cookie-parser

#whats next
added in handlebars for the login stuff but am fairly lost as to how it works
need to bring in js as static file, generally get the app working 
as a handlebars app


# To run locally
node ./server/main.js
http://localhost:8081

# To deploy

# Access the server
Goto Scripts and run: ./sshaws.sh 
This assumes instance is running. 
If instance is stopped and restarted then IP address will need to be updated in this script

# Download the latest (need to move config out of the way due to .gitignore, must be a better way)
mv config ..
git pull
mv ../config .

# If git is being a pain in the xx then just rm -rf * and do a fresh pull:
# git clone https://github.com/patrickmclean/iBrowser2.git

# If config is changed, use filezilla sftp to upload config file
# Don't ever publish the AWS credentials on github!

restart the app:
ps -aux to get the process number
kill -9 PID
node ./server/main.js &
Application is running on X.X.X.X:8081


# Setting up a new server on ec2
Install nvm: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
Activate nvm: . ~/.nvm/nvm.sh
Install node: nvm install node
Install express: npm install express (what's the difference nvm, npm!)
Install aws-sdk: npm install aws-sdk



