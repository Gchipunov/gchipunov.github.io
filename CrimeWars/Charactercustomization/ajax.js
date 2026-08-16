// Source - https://stackoverflow.com/a/8567149
// Posted by dov.amir, modified by community. See post 'Timeline' for change history
// Retrieved 2026-08-16, License - CC BY-SA 4.0

function loadXMLDoc() {
    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == XMLHttpRequest.DONE) { // XMLHttpRequest.DONE == 4
           if (xmlhttp.status == 200) {
               document.getElementById("myDiv").innerHTML = xmlhttp.responseText;
           }
           else if (xmlhttp.status == 400) {
              alert('There was an error 400');
           }
           else {
               alert('something else other than 200 was returned');
           }
        }
    };

    xmlhttp.open("GET", "ajax_info.txt", true);
    xmlhttp.send();
}
function loadSourceSDK2013Assets()
{
var dialogurl = 'https://developer.valvesoftware.com/wiki/Networking_Events_%26_Messages';

}
// https://stackoverflow.com/questions/8567114/how-can-i-make-an-ajax-call-without-jquery
// Source - https://stackoverflow.com/a/31976165
// Posted by Will Munn, modified by community. See post 'Timeline' for change history
// Retrieved 2026-08-16, License - CC BY-SA 4.0

let options = {
  method: 'GET',      
  headers: {}
};

fetch('/get-data', options)
.then(response => response.json())
.then(body => {
  // Do something with body
});


// Source - https://stackoverflow.com/a/31976165
// Posted by Will Munn, modified by community. See post 'Timeline' for change history
// Retrieved 2026-08-16, License - CC BY-SA 4.0

async function doApi(url) {
  const response = await fetch(url);
  if( response.ok ) {
    if( 200 <= response.status && response.status <= 299 ) {
      const result = await response.json();
      // do something awesome with result
    } else {
      console.log( `got a ${response.status}` );
    }
  }
}
