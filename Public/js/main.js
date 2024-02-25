// const { on } = require("nodemon");

var socket = io();
var foundDevices = 0;
var foundDevicesIndex = 0;
var borderColerBlue = "rgba(13, 110, 139, 0.75)";
var borderColerGreen = "Green";
var borderColer333 = "#333";
var borderColorOffline = "#666";
let menuSettingOpen = false;


var pages = [{ID:"1", NAME:"VCA",BUTTONS:["FORWARD","BACKWARD"]},
{ID:"2",NAME:"FOLLOWME",BUTTONS:["",""]},
{ID:"3",NAME:"UNLOAD",BUTTONS:["",""]},
{ID:"4",NAME:"TRAILER",BUTTONS:["",""]},
{ID:"5",AME:"RC",BUTTONS:["",""]}]



function fetchJSON() {
  fetch("./json/pages.json")
    .then((response) => response.json())
    .then((data) => {
      pages = data;
      console.log(pages);
      createNavbar();
      openPages(0);
    });
}

function openPages(index) {
  var element = document.getElementById("button-container");
  element.innerHTML = "";
  console.log(pages[index].BUTTONS.length)
    for (var i = 0; i < pages[index].BUTTONS.length; i++) {
    let num = i + 1 
      if(pages[index].BUTTONS[i] != "" && pages[index].BUTTONS[i] != "-"){
        var button = document.createElement("button");
        button.setAttribute("id", "button"+num);
        button.setAttribute("class", "button");
        button.setAttribute("onclick", "sendData(" + index + "," + i+')');
        button.textContent = pages[index].BUTTONS[i];
        element.appendChild(button);
      }
      }    
  }

socket.on("message", (data) => {
  console.log(data);
});

socket.on("reloadPage", () => {
  console.log("Reloading page");
  fetch("./json/pages.json")
    .then((response) => response.json())
    .then((data) => {
      rooms = data;
      console.log(rooms);
    });
});

function createNavbar() {
  var navbar = "";
  console.log(pages.length);
  for (var i = 0; i < pages.length; i++) {
    navbar += "<li><a onclick='openPages(" + i + ")'>" + pages[i].NAME + "</a></li>";
  }
  document.getElementById("pages").innerHTML = navbar;
}

socket.on("newDeviceFound", (payload) => {
  console.log("newDeviceFound");
  newDevice = payload;
});



function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sendData(index, buttonNum) {
  var payload = index + "-" + buttonNum;
    socket.emit("Button", payload);
  }
