// Function gets called once page load has succeeded
$(document).ready(function() {
    // Load chat history on first open
    loadChatHistory();  
    enterSubmits(); // set enter key to submit 
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
          displayChat(element);   
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
      console.log("complete");
      document.getElementById("mytxt").value = "";
    } 
  })
})


// Event listener for server side events
// Captures page refresh updates
// Info on SSE: https://javascript.info/server-sent-events
var sseSource = new EventSource('/serverstream');

sseSource.addEventListener('message', (e) => {
    let messageType = JSON.parse(e.data).type;
    let messageObj = JSON.parse(e.data).obj;
    if (messageType == 'refresh') {
      displayChat(messageObj);
    };
});

// Turn message object into how we display the content
displayChat = function(messageObj){
  let date = new Date();
  date.setTime(messageObj.utc);
  let messageDisplay = '<div class="chat-sendertext">' + messageObj.sender +" " 
  + date.toLocaleString('en-US',{month: 'short'}) + ' '
  + messageObj.date.day + ' '
  + messageObj.date.hour + ':' 
  + messageObj.date.minutes.toLocaleString('en-US',{minimumIntegerDigits:2}) + ' </div  > ' 
  + messageObj.message;
  if(messageObj.sender == getCookie("User")) {
    $( "#history" ).prepend('<div class="chat-textbox right">' + messageDisplay + '</div>');
  } else {
    $( "#history" ).prepend('<div class="chat-textbox left">' + messageDisplay + '</div>');
  }
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

// Make the enter key click the submit button
function enterSubmits() {
  var input = document.getElementById("mytxt");
  // Execute a function when the user releases a key on the keyboard
  input.addEventListener("keyup", function(event) {
      // Cancel the default action, if needed
      event.preventDefault();
      // Number 13 is the "Enter" key on the keyboard
      if (event.keyCode === 13) {
          // Trigger the button element with a click
          document.getElementById("newmsg").click();
      }
  });
}