// Basic pub sub implementation

const logger = require("./logger");

// this is an IIFE if you're confused about the syntax...

module.exports = (function(){
      var topics = {};
      var hOP = topics.hasOwnProperty;
  
      return {
        subscribe: function(topic, listener) {
          // Create the topic's object if not yet created
          if(!hOP.call(topics, topic)) topics[topic] = [];
    
          logger.write('add listener',topic,3);
          // Add the listener to queue
          var index = topics[topic].push(listener) -1;
    
          // Provide handle back for removal of topic
          return {
            remove: function() {
              delete topics[topic][index];
            }
          };
        },
        publish: function(topic, info) {
          logger.write('pub',topic+" "+info.message,2);
          // If the topic doesn't exist, or there's no listeners in queue, just leave
          if(!hOP.call(topics, topic)) return;
    
          // Cycle through topics queue, fire!
          topics[topic].forEach(function(item) {
            logger.write('sub',item,3);
              item(info != undefined ? info : {});
          });
        }
    };
})();

/* Publish code

events.publish('/page/load', {
	url: '/some/url/path' // any argument
});

*/

/* Subscribe code 

var subscription = events.subscribe('/page/load', function(obj) {
	// Do something now that the event has occurred
});

// ...sometime later where I no longer want subscription...
subscription.remove();

*/

