fs = require('fs');
config = require('../config/config');

module.exports = {
    create: function () {
        if (config.log_to_file == false) return;
        this.filename = config.logfile_directory+'/ibrowser_'+Date().toString().slice(0,24).replace(/ |:/g,"_")+'.log';
        try {
            fs.writeFileSync(this.filename,"#iBrowser Log Starting -"+Date().toString().slice(0,24)+"\n");
        } catch(err) {
            console.error(err);
        }
    },
    write: function(location, message, level){
        if (level <= this.severity) { 
            let today = new Date().toString().slice(0,24);
            line = today + '; ' + location + '; ' + message;
            if (config.log_to_file == true){
                fs.appendFile(this.filename, line+'\n', (err) => { if (err) throw err}); 
            }
            if (config.log_to_console == true){
                console.log(line);
            }
        }
    },
    severity: config.log_level
}
