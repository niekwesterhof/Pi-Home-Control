// const { on } = require("nodemon");

var socket = io();
var foundDevices = 0;
var foundDevicesIndex = 0;
var borderColerBlue = "rgba(13, 110, 139, 0.75)";
var borderColerGreen = "Green";
var borderColer333 = "#333";
var borderColorOffline = "#666";
let menuSettingOpen = false;

var rooms = [
  {
    name: "",
    ID: [
      {
        NAME: "",
        TYPE: "",
        STATUS: "",
        VALUE: 0,
        DEVICE_ID: "",
        WAKEUPTIME: "",
        WAKEUPTIMESTATUS: "",
      },
    ],
  },
];

var settings = [
  {
    Type: [""],
    Device: [{ Name: "", ID: "", Room: "", Type: "" }],
    wakeUp: { Time: "", Day: 0 },
  },
];

var newDevice = [
  {
    Hostname: "",
    IPAddress: "",
  },
];

function fetchJSON() {
  fetch("./json/settings.json")
    .then((response) => response.json())
    .then((data) => {
      settings = data;
      console.log(settings);
    });
  fetch("./json/rooms.json")
    .then((response) => response.json())
    .then((data) => {
      rooms = data;
      console.log(rooms);
      createNavbar();
      openRoom();
      addEventListener();
      setButtonStatus();
    });
}

function openRoom() {
  var element = document.getElementById("button-container");
  element.innerHTML = "";

  for (var j = 0; j < rooms.length; j++) {
    var roomDiv = document.createElement("div");
    roomDiv.setAttribute("class", "button-contrainer-" + rooms[j].name);
    var titleDiv = document.createElement("div");
    titleDiv.setAttribute("class", "title-" + rooms[j].name);
    var title = document.createElement("h5");
    title.innerHTML = rooms[j].name;
    titleDiv.appendChild(title);
    roomDiv.appendChild(titleDiv);

    for (var i = 0; i < rooms[j].ID.length; i++) {
      var div = document.createElement("div");
      var labelElement = document.createElement("input");
      labelElement.setAttribute("class", "control-label");
      labelElement.setAttribute("type", "text");
      labelElement.setAttribute("value", rooms[j].ID[i].NAME);
      labelElement.disabled = true;

      div.setAttribute("class", "control");
      div.appendChild(labelElement);
      if (rooms[j].ID[i].TYPE == "Toggle" || rooms[j].ID[i].TYPE == "Dimmer" || rooms[j].ID[i].TYPE == "wakeUp") {
        var on = document.createElement("button");
        on.setAttribute("id", rooms[j].name + "-" + rooms[j].ID[i].NAME + "-on-" + rooms[j].ID[i].DEVICE_ID);
        on.setAttribute("class", "control-on");
        on.setAttribute("onclick", "sendData(" + j + "," + i + ', "on")');
        on.textContent = "On";

        var off = document.createElement("button");
        off.setAttribute("id", rooms[j].name + "-" + rooms[j].ID[i].NAME + "-off-" + rooms[j].ID[i].DEVICE_ID);
        off.setAttribute("class", "control-off");
        off.setAttribute("onclick", "sendData(" + j + "," + i + ', "off")');
        off.textContent = "Off";

        div.appendChild(on);
        div.appendChild(off);
      }
      if (rooms[j].ID[i].TYPE == "Dimmer" || rooms[j].ID[i].TYPE == "wakeUp") {
        var slider = document.createElement("input");
        slider.setAttribute("type", "range");
        slider.setAttribute("class", "control-slider");
        slider.setAttribute("id", rooms[j].name + "-" + rooms[j].ID[i].NAME + "-slider-" + rooms[j].ID[i].DEVICE_ID);
        slider.setAttribute("min", 0);
        slider.setAttribute("max", 1000);
        slider.setAttribute("value", rooms[j].ID[i].VALUE);
        slider.setAttribute("step", 5);
        slider.setAttribute("oninput", "sendData(" + j + "," + i + ', "dimmer")');
        div.appendChild(slider);
      }

      roomDiv.appendChild(div);
    }
    element.appendChild(roomDiv);
    //setButtonStatus();
  }
}

function setButtonStatus() {
  for (var j = 0; j < rooms.length; j++) {
    for (var i = 0; i < rooms[j].ID.length; i++) {
      var buttonOff = rooms[j].name + "-" + rooms[j].ID[i].NAME + "-off-" + rooms[j].ID[i].DEVICE_ID;
      var buttonOn = rooms[j].name + "-" + rooms[j].ID[i].NAME + "-on-" + rooms[j].ID[i].DEVICE_ID;
      if (rooms[j].ID[i].STATUS == 0) {
        document.getElementById(buttonOff).style.borderColor = borderColerBlue;
        document.getElementById(buttonOff).disabled = true;
        document.getElementById(buttonOn).style.borderColor = borderColer333;
        document.getElementById(buttonOn).disabled = false;
      } else if (rooms[j].ID[i].STATUS == 1) {
        document.getElementById(buttonOff).style.borderColor = borderColer333;
        document.getElementById(buttonOff).disabled = false;
        document.getElementById(buttonOn).style.borderColor = borderColerBlue;
        document.getElementById(buttonOn).disabled = true;
      } else {
        document.getElementById(buttonOff).style.borderColor = borderColorOffline;
        document.getElementById(buttonOff).disabled = true;
        document.getElementById(buttonOn).style.borderColor = borderColorOffline;
        document.getElementById(buttonOn).disabled = true;
      }
    }
  }
}

function sendData(indexRoom, indexID, val) {
  var payload = "wakeUpLED-";
  payload = payload + rooms[indexRoom].ID[indexID].DEVICE_ID;

  if (val == "on") {
    payload = payload + "-on";
    payload = payload + "-" + rooms[indexRoom].ID[indexID].TYPE + "-";

    document.getElementById("statusbar").value = payload;
    socket.emit("command", payload);
  }
  if (val == "off") {
    payload = payload + "-off";
    payload = payload + "-" + rooms[indexRoom].ID[indexID].TYPE + "-";

    document.getElementById("statusbar").value = payload;
    socket.emit("command", payload);
  }
  if (val == "dimmer") {
    var slider = document.getElementById(rooms[indexRoom].name + "-" + rooms[indexRoom].ID[indexID].NAME + "-slider-" + rooms[indexRoom].ID[indexID].DEVICE_ID)
      .value;
    payload = payload + "-dimmer-" + rooms[indexRoom].ID[indexID].TYPE + "-" + slider + "-";

    document.getElementById("statusbar").value = payload;
    socket.emit("command", payload);
  }
}

socket.on("message", (data) => {
  console.log(data);
});

socket.on("reloadPage", () => {
  console.log("Reloading page");
  fetch("./json/rooms.json")
    .then((response) => response.json())
    .then((data) => {
      rooms = data;
      console.log(rooms);
    });
  fetch("./json/settings.json")
    .then((response) => response.json())
    .then((data) => {
      settings = data;
      console.log(settings);
    });

  setButtonStatus();
});

socket.on("reloadRooms", (data) => {
  rooms = data;
  setButtonStatus();
});

socket.on("reloadSettings", (data) => {
  settings = data;
});

function showSettingsMenu() {
  closeSettingsMenu();
  var element = document.getElementById("setTimer");
  element.innerHTML = "";
  document.getElementById("settingsMenu").style.display = "block";
  var time = document.createElement("input");
  time.setAttribute("type", "time");
  time.setAttribute("step", 1);
  time.setAttribute("id", "setWakeUpTime");
  time.setAttribute("value", settings.wakeUp.Time);

  element.appendChild(time);

  // var sendTime = document.createElement("button");
  // sendTime.setAttribute("onclick", "sendData()");
  // element.appendChild(sendTime);
  var data = settings.wakeUp.Day;
  if (data - 64 >= 0) {
    data = data - 64;
    document.getElementById("weekButtonSunday").checked = true;
  } else {
    document.getElementById("weekButtonSunday").checked = false;
  }
  if (data - 32 >= 0) {
    data = data - 32;
    document.getElementById("weekButtonSaterday").checked = true;
  } else {
    document.getElementById("weekButtonSaterday").checked = false;
  }
  if (data - 16 >= 0) {
    data = data - 16;
    document.getElementById("weekButtonFriday").checked = true;
  } else {
    document.getElementById("weekButtonFriday").checked = false;
  }
  if (data - 8 >= 0) {
    data = data - 8;
    document.getElementById("weekButtonThursday").checked = true;
  } else {
    document.getElementById("weekButtonThursday").checked = false;
  }
  if (data - 4 >= 0) {
    data = data - 4;
    document.getElementById("weekButtonWednesday").checked = true;
  } else {
    document.getElementById("weekButtonWednesday").checked = false;
  }
  if (data - 2 >= 0) {
    data = data - 2;
    document.getElementById("weekButtonTuesday").checked = true;
  } else {
    document.getElementById("weekButtonTuesday").checked = false;
  }
  if (data - 1 >= 0) {
    data = data - 1;
    document.getElementById("weekButtonMonday").checked = true;
  } else {
    document.getElementById("weekButtonMonday").checked = false;
  }
}

function hideSettingsMenu() {
  document.getElementById("settingsMenu").style.display = "none";
  var weekValue = 0;
  var monday = document.getElementById("weekButtonMonday").checked;
  var tuesday = document.getElementById("weekButtonTuesday").checked;
  var wednesday = document.getElementById("weekButtonWednesday").checked;
  var thursday = document.getElementById("weekButtonThursday").checked;
  var friday = document.getElementById("weekButtonFriday").checked;
  var saterday = document.getElementById("weekButtonSaterday").checked;
  var sunday = document.getElementById("weekButtonSunday").checked;
  console.log(monday);
  if (monday == true) {
    weekValue = weekValue + 1;
  }
  if (tuesday == true) {
    weekValue = weekValue + 2;
  }
  if (wednesday == true) {
    weekValue = weekValue + 4;
  }
  if (thursday == true) {
    weekValue = weekValue + 8;
  }
  if (friday == true) {
    weekValue = weekValue + 16;
  }
  if (saterday == true) {
    weekValue = weekValue + 32;
  }
  if (sunday == true) {
    weekValue = weekValue + 64;
  }
  console.log(weekValue);
  settings.wakeUp.Day = weekValue;
  settings.wakeUp.Time = document.getElementById("setWakeUpTime").value;
  console.log(settings.wakeUp.Day);
  socket.emit("settings", settings);
  menuSettingOpen = false;
}

function showAddDeviceMenu() {
  createAddDeviceMenu();
  closeSettingsMenu();
  document.getElementById("addDevice").style.display = "block";
}

function hideAddDeviceMenu() {
  document.getElementById("addDevice").style.display = "none";
  menuSettingOpen = false;
}

function showDeviceMenu() {
  console.log("showDeviceMenu");
  document.getElementById("deviceMenu").style.display = "block";
  closeSettingsMenu();
  // make list of connected devices
  console.log(settings.Device.length);
  for (var i = 0; i < settings.Device.length; i++) {
    var connectedDevice = document.createElement("div");
    if (settings.Device[i].Status == 1) {
      connectedDevice.setAttribute("id", "connectedDevice" + settings.Device[i].ID);
      connectedDevice.innerHTML = settings.Device[i].Name + " " + settings.Device[i].Room + " " + settings.Device[i].Type + " " + settings.Device[i].Hostname;
      connectedDevice.setAttribute("style", "border : 3px solid green; padding: 5px;margin: 5px;");
    } else {
      connectedDevice.setAttribute("id", "connectedDevice" + settings.Device[i].ID);
      connectedDevice.innerHTML = settings.Device[i].Name + " " + settings.Device[i].Room + " " + settings.Device[i].Type + " " + settings.Device[i].Hostname;
      connectedDevice.setAttribute("style", "border : 3px solid grey; padding: 5px; margin: 5px;");
    }
    document.getElementById("connectedDevices").appendChild(connectedDevice);
  }
}

function hideDeviceMenu() {
  document.getElementById("deviceMenu").style.display = "none";
  menuSettingOpen = false;
}

function closeSettingsMenu() {
  const menuButtonSettings = document.querySelector(".menu-button-settings");
  menuButtonSettings.classList.remove("open");
  document.getElementById("settingsDropdown").style.display = "none";
  menuSettingOpen = true;
}

function addDevice() {
  document.getElementById("AddDeviceRoom").style.borderColor = "#333";
  document.getElementById("AddDeviceName").style.borderColor = "#333";
  document.getElementById("AddDeviceType").style.borderColor = "#333";
  document.getElementById("AddDeviceValue").style.borderColor = "#333";
  document.getElementById("SelectDevice").style.borderColor = "#333";

  if (document.getElementById("AddDeviceRoom").value == "" || document.getElementById("AddDeviceRoom").value == null) {
    document.getElementById("AddDeviceRoom").style.borderColor = "red";
  }
  if (document.getElementById("AddDeviceName").value == "" || document.getElementById("AddDeviceName").value == null) {
    document.getElementById("AddDeviceName").style.borderColor = "red";
  }
  if (document.getElementById("AddDeviceType").value == "") {
    document.getElementById("AddDeviceType").style.borderColor = "red";
  }
  if (document.getElementById("AddDeviceValue").value == "" || document.getElementById("AddDeviceValue").value == null) {
    document.getElementById("AddDeviceValue").style.borderColor = "red";
  }
  if (document.getElementById("SelectDevice").value == "" || document.getElementById("SelectDevice").value == null) {
    document.getElementById("SelectDevice").style.borderColor = "red";
  }

  if (
    (document.getElementById("AddDeviceRoom").value == "" || document.getElementById("AddDeviceRoom").value == null) &&
    (document.getElementById("AddDeviceName").value == "" || document.getElementById("AddDeviceName").value == null) &&
    (document.getElementById("AddDeviceType").value == "" || document.getElementById("AddDeviceType").value == null) &&
    (document.getElementById("AddDeviceValue").value == "" || document.getElementById("AddDeviceValue").value == null) &&
    (document.getElementById("SelectDevice").value == "" || document.getElementById("SelectDevice").value == null)
  ) {
  } else {
    var index = rooms.findIndex(function (item, i) {
      return item.name === document.getElementById("AddDeviceRoom").value;
    });
    var ID_index = rooms[index].ID.length;
    rooms[index].ID[ID_index] = {
      NAME: document.getElementById("AddDeviceName").value,
      TYPE: document.getElementById("AddDeviceType").value,
      STATUS: "ON",
      VALUE: document.getElementById("AddDeviceValue").value,
      DEVICE_ID: document.getElementById("SelectDevice").value,
    };
    socket.emit("json", rooms);
  }
}

function createNavbar() {
  var navbar = "";
  for (var i = 0; i < rooms.length; i++) {
    navbar += "<li><a onclick='openRoom(" + i + ")'>" + rooms[i].name + "</a></li>";
  }
  document.getElementById("rooms").innerHTML = navbar;
}

socket.on("newDeviceFound", (payload) => {
  if (payload == "NoDeviceFound"){
    console.log("No New Devices Found");
  } else
  {
  console.log("newDeviceFound");
  newDevice = payload;
  }
});

function findNewDevices() {
  socket.emit("newDevice", "pingForNewDevices");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createAddDeviceMenu() {
  findNewDevices();
  document.getElementById("loadingDevices").style.display = "block";
  document.getElementById("addDevicesForm").style.display = "none";
  sleep(1000).then(() => {
    document.getElementById("loadingDevices").style.display = "none";
    document.getElementById("addDevicesForm").style.display = "block";
    var AddDeviceRoom = '<option value="" disabled selected hidden>Select Room</option>';
    for (var i = 0; i < rooms.length; i++) {
      AddDeviceRoom += "<option>" + rooms[i].name + "</option>";
    }
    var AddDeviceType = '<option value="" disabled selected hidden>Select Type</option>';
    for (var i = 0; i < settings.Type.length; i++) {
      AddDeviceType += "<option>" + settings.Type[i] + "</option>";
    }
    console.log("Sleep is over");
    if (newDevice.length > 0) {
      var SelectDevice = '<option value="" disabled selected hidden>Select Device</option>';
      for (var i = 0; i < newDevice.length; i++) {
        SelectDevice += "<option>" + newDevice[i].Hostname + "</option>";
        newDevice[i].Hostname = "";
        newDevice[i].IPAddress = "";
      }
    } else {
      console.log("ErroMessage: No device found");
      // TO BE ADDED MESSAGE UNDER FORM
    }
    document.getElementById("SelectDevice").innerHTML = SelectDevice;
    document.getElementById("AddDeviceRoom").innerHTML = AddDeviceRoom;
    document.getElementById("AddDeviceType").innerHTML = AddDeviceType;
  });
}

function addEventListener() {
  const menuButtonSettings = document.querySelector(".menu-button-settings");
  menuButtonSettings.addEventListener("click", () => {
    if (!menuSettingOpen) {
      menuButtonSettings.classList.add("open");
      document.getElementById("settingsDropdown").style.display = "block";
      menuSettingOpen = true;
    } else {
      menuButtonSettings.classList.remove("open");
      document.getElementById("settingsDropdown").style.display = "none";
      menuSettingOpen = false;
    }
  });

  const menuButtonRoom = document.querySelector(".menu-button-room");
  let menuRoomOpen = false;
  menuButtonRoom.addEventListener("click", () => {
    if (!menuRoomOpen) {
      menuButtonRoom.classList.add("open");
      document.querySelector(".body").classList.add("active");
      menuRoomOpen = true;
      document.getElementById("nav-bar-left").style.display = "block";
    } else {
      menuButtonRoom.classList.remove("open");
      menuRoomOpen = false;
      document.querySelector(".body").classList.remove("active");
      document.getElementById("nav-bar-left").style.display = "none";
    }
  });
}
