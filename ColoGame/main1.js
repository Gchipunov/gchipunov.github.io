// main1.js
//

//GBL =  {};


GBL = {};

GBL.Media = 'media/images/';

GBL.character = {};


GBL.character.steps_amount = 4;
GBL.character.x = 64;
GBL.character.y = 36;
GBL.character.width = 64;
GBL.character.height = 64;


GBL.badguy1 = {};
GBL.badguy1.name = "LGBT Case pendehoe";
// stupid_40x61_lgbtq+++centered.png
GBL.badguy1.imgsrc =  GBL.Media +"stupid_40x61_lgbtq+++centered.png";

GBL.badguy1.x = 250;  // left
GBL.badguy1.y = 50;    // top

GBL.badguy1.width = 40;
GBL.badguy1.height = 61;



GBL.character.x = 50;
GBL.character.y = 25;
GBL.character.imgid = 3;


function index2()
{
var img1 = document.getElementById('Pee3zy13.png');

img1.src= GBL.Media +'Pee3zy14.png';

img1.style = "position: absolute";
img1.style.top = "100px";

img1.style.left = "120px";

}
function index3()
{
var img1 = document.getElementById('Pee3zy13.png');

img1.src= GBL.Media +'Pee3zy1'+GBL.character.imgid  +'.png';
GBL.character.imgid++;

if(GBL.character.imgid >6)
{
GBL.character.imgid  = 3;

}

img1.style = "position: absolute";
//img1.style.top = "100px";


var newXPX = img1.style.left;
//newXPX.trim
// okok =okok.split('px');
console.log('var newXPX = img1.style.left;:' + newXPX);

newXPX = newXPX.substr(0,newXPX.length-2);
// '100px';
console.log('first newXPX:' + newXPX);
//var newX = parseInt(newXPX);
//var newX = parseFloat(newXPX);
var newX = (newXPX);

//alert(newX);
console.log('newX: ' + newX);
newX++;
GBL.character.x++;

//alert(newX);
console.log('newX++: ' +newX);

img1.style.left = GBL.character.x + "px";


}
function fun1()
{
var div1 = document.getElementById('div1');


div1.innerHTML = "<a href='index2'>index2</a> <BR /> <a onclick='index2()'>index3</a>  <BR /> <a onclick='index3()'>index4</a>";

var div1img = document.createElement('img');
 div1img.src= GBL.Media +'Pee3zy13.png';
div1img.id = "Pee3zy13.png";
div1img.style = "position: absolute";
div1img.style.top =  GBL.character.x + "px";//"10px";

div1img.style.left =  GBL.character.y + "px";


//div1.attachElement( div1img);
div1.appendChild( div1img);
var div1img2 = document.createElement('img');
 div1img2.src= GBL.Media +'Pee3zy15.png';
div1img2.id = "Pee3zy15.png";
div1.appendChild( div1img2);

// RTCRtpReceiver  - find out it connected to



var div1img3 = document.createElement('img');
 div1img3.src= GBL.Media +'Pee3zy16.png';
div1img3.id = "Pee3zy16.png";
div1.appendChild( div1img3);

div1.appendChild( div1img3);

//var div2 = document.createElement('div');
// document.attachElement


}


function makebadguy1()
{
var div1 = document.getElementById('div1');


//div1.innerHTML = "<a href='index2'>index2</a> <BR /> <a onclick='index2()'>index3</a>  <BR /> <a onclick='index3()'>index4</a>";

var div1img = document.createElement('img');

// GBL.badguy1.name = "LGBT Case pendehoe";
// stupid_40x61_lgbtq+++centered.png
// GBL.badguy1.imgsrc= = "stupid_40x61_lgbtq+++centered.png";

//GBL.badguy1.x = 150;
//GBL.badguy1.y = 25;

//GBL.badguy1.width = 40;
//GBL.badguy1.height = 61;


 div1img.src=  GBL.badguy1.imgsrc;

div1img.id = GBL.badguy1.imgsrc;
div1img.style = "position: absolute";
div1img.style.top = GBL.badguy1.y +"px";

div1img.style.left =  GBL.badguy1.x +"px";;

//div1img.style.top = GBL.badguy1.width +"px";

//div1img.style.left =  GBL.badguy1.height +"px";;


//div1.attachElement( div1img);
div1.appendChild( div1img);


}

function checkCollisionObjObj( obj1, obj2)
{
var width1 = obj1.width;


}

function fun2()
{
// setTimeout

}

function mainLoop()
{

var div1img  = document.getElementById('Pee3zy13.png'); 
div1img.style = "position: absolute";
div1img.style.top = "200px";

div1img.style.right = "100px";

div1img.style = "position: absolute";
div1img.style.top = "100px";

div1img.style.left = "120px";

}

function setupBackground()
{


//background-image: url(levelstart1.png);
   // z-index: 0;
  ////  background-position-x: right;
  ////  width: 100%;
 ////   background-position-y: top;
  //  height: 999px;
//    background-repeat: no-repeat;

}

fun1();
makebadguy1();

// pre copied from backup
GBLGAME = {};

GBLGAME.badguy = {};
GBLGAME.badguy.deadicons = {};
GBLGAME.badguy.hawkinStopX = 184;
GBLGAME.badguy.stateInit = 0;

function hawkinStop()
{
var img2 = document.getElementById('stupid_40x61_lgbtq+++centered.png');
GBLGAME.badguy.stateInit = 1;


var div2img = document.createElement('div');

div2img.style.backgroundimage =  "url("+GBL.Media +"hawkins_bubble1.png)" ;



}

function hawkinStop2()
{
var img3 = document.getElementById('stupid_40x61_lgbtq+++centered.png');
GBLGAME.badguy.stateInit = 3;


}

function MoveCharacterForward()
{
var img1 = document.getElementById('Pee3zy13.png');

img1.src= GBL.Media +'Pee3zy1'+GBL.character.imgid  +'.png';
GBL.character.imgid++;

if(GBL.character.imgid > 6)
{
GBL.character.imgid  = 3;

}

img1.style = "position: absolute";
//img1.style.top = "100px";


var newXPX = img1.style.left;
//newXPX.trim
// okok =okok.split('px');
console.log('var newXPX = img1.style.left;:' + newXPX);

if(newX > GBLGAME.badguy.hawkinStopX)
{
hawkinStop();
}

newXPX = newXPX.substr(0,newXPX.length-2);
// '100px';
console.log('first newXPX:' + newXPX);
//var newX = parseInt(newXPX);
//var newX = parseFloat(newXPX);
var newX = (newXPX);

//alert(newX);
console.log('newX: ' + newX);
newX++;
GBL.character.x++;

//alert(newX);
console.log('newX++: ' +newX);

img1.style.left = GBL.character.x + "px";


}

GBL.ok1 = Array();


function User()
{


User.prototype.init()
{
this.UserID = undefined;

this.UserName = undefined;
this.UserScore= undefined;
this.UserTime= undefined;

this.UserSession= undefined;

this.UserMenuMode= undefined;

}

User.prototype.initTest()
{
this.UserID = 123;

this.UserName = "dorkus";
this.UserScore= 10;
this.UserTime= 0;

this.UserSession= "FFEEAABB";
this.UserMenuMode= 1;

}

User.prototype.update()
{

}

}
function CreateDiv(mainDiv)
{


}



function init()
{
GBLGAME.badguy.picture = GBL.Media +"stupid_40x61_lgbtq+++centered.png";

GBLGAME.badguy.aliveicons = GBL.Media +"stupid_40x61_lgbtq+++centered.png";

GBLGAME.badguy.deadicons.icons = Array();
GBLGAME.badguy.deadicons.icons[0] = GBL.Media +"stupid_40x61_lgbtq+++centered_bloody1.png";
GBLGAME.badguy.deadicons.icons[1] =  GBL.Media +"stupid_40x61_lgbtq+++centered_bloody2.png";
GBLGAME.badguy.deadicons.icons[2] = GBL.Media + "stupid_40x61_lgbtq+++centered_bloody3.png";
GBLGAME.badguy.deadicons.icons[3] =  GBL.Media + "stupid_40x61_lgbtq+++centered_bloody4.png";
GBLGAME.badguy.deadicons.icons[4] =  GBL.Media + "stupid_40x61_lgbtq+++centered_bloody5.png";

//alert('main');


}

function initMiscCharacters()
{
// Pee3zy_bubble1.png
// person1.png

}

function initBigBubbles()
{
// Pee3zy_bubble1.png
// person1.png
var divSpeaker1 = document.createElement('div');
var divSpeaker2 = document.createElement('div');
// mains
var divSpeaker3 = document.createElement('div');

var divSpeaker4 = document.createElement('div');


}

function initMainBackground()
{
// div1
alert('initMainBackground div1');

var div1 = document.getElementById('div1');
div1.style.backgroundImage =  "url("+ GBL.Media + "levelstart3.png)" ;

var div2text = document.createElement('div');
div2text.innerText = 'Wo zhaoqian - I am looking for money (I am looking for work).▀▄█▌▐░▒▓■□▪▫▬▲►▼◄◊○◌●◘◙◦☺☻☼♠♣♥♦♪';

div1.appendChild( div2text);

}

function initKeyboardEventListener()
{
//addEventListener
//document.AddEventListener();

//var keyPress = KeyboardEvent.prototype.keyCode == 'S';
//KeyboardEvent(KeyboardEvent.prototype.key(S), function () {
//alert('S');
//});

//new KeyboardEvent.call(function (dataArgs) {
//alert('S');
//});

}

function main()
{
// chrome://resources/polymer/v3_0/polymer/polymer_bundled.min.js
// POINTERSTATE.mouse.mouseIgnoreJob=Debouncer.debounce(POINTERSTATE.mouse.mouseIgnoreJob,timeOut.after(MOUSE_TIMEOUT),unset)}function hasLeftMouseButton(ev){let type=ev.type;if(!isMouseEvent(type)){return false}if(type==="mousemove"){let buttons=ev.buttons===undefined?1:ev.buttons;if(ev instanceof window.MouseEvent&&!MOUSE_HAS_BUTTONS){buttons=MOUSE_WHICH_TO_BUTTONS[ev.which]||0}return Boolean(buttons&1)}else{let button=ev.button===undefined?0:ev.button;return button===0}}function isSyntheticClick(ev){if(ev.type==="click"){if(ev.detail===0){return true}let t=_findOriginalTarget(ev);if(!t.nodeType||t.nodeType!==Node.ELEMENT_NODE){return true}let bcr=t.getBoundingClientRect();let x=ev.pageX,y=ev.pageY;return!(x>=bcr.left&&x<=bcr.right&&(y>=bcr.top&&y<=bcr.bottom))}return false}let POINTERSTATE={mouse:{target:null,mouseIgnoreJob:null},touch:{x:0,y:0,id:-1,scrollDecided:false}};function firstTouchAction(ev){let ta="auto";let path=getComposedPath(ev);for(let i=0,n;i<path.length;i++){n=path[i];if(n[TOUCH_ACTION]){//ta=n[TOUCH_ACTION];break}}return ta}function trackDocument(stateObj,movefn,upfn){stateObj.movefn=movefn;stateObj.upfn=upfn;document.addEventListener("mousemove",movefn);document.addEventListener("mouseup",upfn)}function untrackDocument(stateObj){document.removeEventListener("mousemove",stateObj.movefn);document.removeEventListener("mouseup",stateObj.upfn);stateObj.movefn=null;stateObj.upfn=null}document.addEventListener("touchend",ignoreMouse,SUPPORTS_PASSIVE?{passive:true}:false);const getComposedPath=window.ShadyDOM&&window.ShadyDOM.noPatch?
//=Array.prototype.slice.call(el.labels||[]);if(!labels.length){labels=[];let root=el.getRootNode();if(el.id){let matching=root.querySelectorAll(`label[for = ${el.id}]`);for(let i=0;i<matching.length;i++){labels.push(matching[i])}}}return labels}let mouseCanceller=function(mouseEvent){let sc=mouseEvent.sourceCapabilities;if(sc&&!sc.firesTouchEvents){return}mouseEvent[HANDLED_OBJ]={skip:true};if(mouseEvent.type==="click"){let clickFromLabel=false;let path=getComposedPath(mouseEvent);for(let i=0;i<path.length;i++){if(path[i].nodeType===Node.ELEMENT_NODE){if(path[i].localName==="label"){clickedLabels.push(path[i])}else if(canBeLabelled(path[i])){let ownerLabels=matchingLabels(path[i]);for(let j=0;j<ownerLabels.length;j++){clickFromLabel=clickFromLabel||clickedLabels.indexOf(ownerLabels[j])>-1}}}if(path[i]===POINTERSTATE.mouse.target){return}}if(clickFromLabel){return}mouseEvent.preventDefault();mouseEvent.stopPropagation()}};function setupTeardownMouseCanceller(setup){let events=IS_TOUCH_ONLY?["click"]:MOUSE_EVE//NTS;for(let i=0,en;i<events.length;i++){en=events[i];if(setup)


alert('main');
//document.addEventListener(KeyboardEvent);
document.addEventListener("keydown", function(e) {
// alert(e)
console.log(e);
if(e.key === "s")
{
MoveCharacterForward();
console.log('MoveCharacterForward()');
}

 } );
document.addEventListener("click", function(e) { 
console.log(e);
//alert(e)

 } );
document.addEventListener("mousemove", function(e) { 
//alert(e)
console.log(e);
 } );
 document.addEventListener("mouseup", function(e) { 
//alert(e) 
console.log(e);
} );
 document.addEventListener("touchend", function(e) { 
//alert(e)
console.log(e);
 } );






}

function test1()
{
alert('test1 asd');
var div1img  = document.getElementById('Pee3zy13.png'); 

}

test1();
initMainBackground();
initKeyboardEventListener();
