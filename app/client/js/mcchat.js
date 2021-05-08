// Function gets called once page load has succeeded
$(document).ready(function() {
    // Load chat history on first open
    loadChatHistory();   
})

// Load chat history
loadChatHistory = function() {
  let group = '1';
  let sender = getCookie("User");
  $( "#username" ).append( sender);
  $.ajax({  
    url: '/loadhistory',
    type: "GET",
    data: { 
      sdr: sender, 
      grp: group 
    },
    dataType: "json",
    contentType: "application/json; charset=utf-8",
    success: function(data){
        console.log("loadhistory success"+data.return)
        data.forEach(element => {
          let messageDisplay = formatChat(element);
          $( "#history" ).prepend( messageDisplay + '<br>');
        });
    },
    error: function(){
      console.log("loadhistory ajax error");
    },
    complete: function(){
      console.log("loadhistory complete")
    } 
  })
}

// Send message
$(document).on("click", "#newmsg", function() {
  let message = document.getElementById("mytxt").value;
  let group = '1';
  let sender = getCookie("User");
  $.ajax({  
    url: '/newmsg',
    type: "POST",
    dataType: "json",
    contentType: "application/json",
    data: JSON.stringify({sdr:sender,msg:message,grp:group}),
    success: function(data){
        console.log("return"+data.return)
    },
    error: function(){
      console.log("ajax error");
    },
    complete: function(){
      console.log("complete")
    } 
  })
})

/* Username password stuff
https://codeforgeek.com/handle-get-post-request-express-4/
*/


// Event listener for server side events
// Captures page refresh updates
// Info on SSE: https://javascript.info/server-sent-events
var sseSource = new EventSource('/serverstream');

sseSource.addEventListener('message', (e) => {
    let messageType = JSON.parse(e.data).type;
    let messageObj = JSON.parse(e.data).obj;
    let messageDisplay = formatChat(messageObj);
    console.log('sse '+ messageDisplay);
    if (messageType == 'refresh') {
      $( "#history" ).prepend( messageDisplay + '<br>');
    };
});

// Turn message object into how we display the content
formatChat = function(messageObj){
  let messageDisplay = messageObj.date.hour + ':' 
  + messageObj.date.minutes.toLocaleString('en-US',{minimumIntegerDigits:2}) + ' ' 
  + messageObj.sender + ' => '
  + messageObj.message;
  return messageDisplay;
}

// Parse cookie
function getCookie(cname) {
  var name = cname + "=";
  var ca = document.cookie.split(';');
  for(var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

function checkCookie() {
  let user = getCookie("User");
  if (user != "") {
    alert("Welcome again " + user);
  } else {
    user = prompt("Please enter your name:", "");
    if (user != "" && user != null) {
      setCookie("username", user, 365);
    }
  }
}