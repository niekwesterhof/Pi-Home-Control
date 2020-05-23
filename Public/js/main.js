var socket = io();
var selectedRoom = 0;
var foundDevices = 0;
var foundDevicesIndex = 0;
var borderColerBlue = "rgba(13, 110, 139, 0.75)";
var borderColerGreen = "Green";
var borderColer333 = "#333";
var borderColorOffline = "#666";
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

var settings = [{ Type: [""], Device: [{ Name: "", ID: "", Room: "", Type: "" }], wakeUp: { Time: "", Day: 0 } }];

function fetchsJSON() {
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
      openRoom(0);
      addEventListener();
    });
}

function openRoom(index) {
  selectedRoom = index;
  var element = document.getElementById("button-container");
  element.innerHTML = "";
  for (var i = 0; i < rooms[index].ID.length; i++) {
    var element = document.getElementById("button-container");
    var div = document.createElement("div");
    var labelElement = document.createElement("input");
    labelElement.setAttribute("class", "control-label");
    labelElement.setAttribute("type", "text");
    labelElement.setAttribute("value", rooms[index].ID[i].NAME);
    labelElement.disabled = true;

    div.setAttribute("class", "control");
    div.appendChild(labelElement);
    if (rooms[index].ID[i].TYPE == "Toggle" || rooms[index].ID[i].TYPE == "Dimmer" || rooms[index].ID[i].TYPE == "wakeUp") {
      var on = document.createElement("button");
      on.setAttribute("id", "on-" + rooms[index].ID[i].DEVICE_ID);
      on.setAttribute("class", "control-on");
      on.setAttribute("onclick", "sendData(" + index + "," + i + ', "on")');
      on.textContent = "On";

      var off = document.createElement("button");
      off.setAttribute("id", "off-" + rooms[index].ID[i].DEVICE_ID);
      off.setAttribute("class", "control-off");
      off.setAttribute("onclick", "sendData(" + index + "," + i + ', "off")');
      off.textContent = "Off";

      div.appendChild(on);
      div.appendChild(off);
    }
    if (rooms[index].ID[i].TYPE == "Dimmer" || rooms[index].ID[i].TYPE == "wakeUp") {
      var slider = document.createElement("input");
      slider.setAttribute("type", "range");
      slider.setAttribute("class", "control-slider");
      slider.setAttribute("id", "slider" + rooms[index].ID[i].DEVICE_ID);
      slider.setAttribute("min", 0);
      slider.setAttribute("max", 1000);
      slider.setAttribute("value", rooms[index].ID[i].VALUE);
      slider.setAttribute("step", 5);
      slider.setAttribute("oninput", "sendData(" + index + "," + i + ', "dimmer")');
      div.appendChild(slider);
    }
    if (rooms[index].ID[i].TYPE == "wakeUp") {
      var time = document.createElement("input");
      time.setAttribute("type", "time");
      time.setAttribute("step", 1);
      time.setAttribute("id", "time" + rooms[index].ID[i].DEVICE_ID);
      time.setAttribute("value", settings.wakeUp.Time);

      div.appendChild(time);

      var sendTime = document.createElement("button");
      sendTime.setAttribute("onclick", "sendData(" + index + "," + i + ', "sendTime")');
      div.appendChild(sendTime);
    }
    element.appendChild(div);
    if (rooms[index].ID[i].STATUS == 0) {
      document.getElementById("off-" + rooms[index].ID[i].DEVICE_ID).style.borderColor = borderColerBlue;
      document.getElementById("off-" + rooms[index].ID[i].DEVICE_ID).disabled = true;
      document.getElementById("on-" + rooms[index].ID[i].DEVICE_ID).style.borderColor = borderColer333;
      document.getElementById("on-" + rooms[index].ID[i].DEVICE_ID).disabled = false;
    } else if (rooms[index].ID[i].STATUS == 1) {
      document.getElementById("off-" + rooms[index].ID[i].DEVICE_ID).style.borderColor = borderColer333;
      document.getElementById("off-" + rooms[index].ID[i].DEVICE_ID).disabled = false;
      document.getElementById("on-" + rooms[index].ID[i].DEVICE_ID).style.borderColor = borderColerBlue;
      document.getElementById("on-" + rooms[index].ID[i].DEVICE_ID).disabled = true;
    } else {
      document.getElementById("off-" + rooms[index].ID[i].DEVICE_ID).style.borderColor = borderColorOffline;
      document.getElementById("off-" + rooms[index].ID[i].DEVICE_ID).disabled = true;
      document.getElementById("on-" + rooms[index].ID[i].DEVICE_ID).style.borderColor = borderColorOffline;
      document.getElementById("on-" + rooms[index].ID[i].DEVICE_ID).disabled = true;
    }
  }
}

function sendData(indexRoom, indexID, val) {
  var payload = rooms[indexRoom].ID[indexID].DEVICE_ID;

  if (val == "on") {
    payload = payload + "-on";
    document.getElementById("off-" + rooms[indexRoom].ID[indexID].DEVICE_ID).style.borderColor = borderColer333;
    document.getElementById("off-" + rooms[indexRoom].ID[indexID].DEVICE_ID).disabled = false;
    document.getElementById("on-" + rooms[indexRoom].ID[indexID].DEVICE_ID).style.borderColor = borderColerBlue;
    document.getElementById("on-" + rooms[indexRoom].ID[indexID].DEVICE_ID).disabled = true;
    payload = payload + "-" + rooms[indexRoom].ID[indexID].TYPE;

    document.getElementById("statusbar").value = payload;
    socket.emit("command", payload);
  }
  if (val == "off") {
    payload = payload + "-off";
    document.getElementById("off-" + rooms[indexRoom].ID[indexID].DEVICE_ID).style.borderColor = borderColerBlue;
    document.getElementById("off-" + rooms[indexRoom].ID[indexID].DEVICE_ID).disabled = true;
    document.getElementById("on-" + rooms[indexRoom].ID[indexID].DEVICE_ID).style.borderColor = borderColer333;
    document.getElementById("on-" + rooms[indexRoom].ID[indexID].DEVICE_ID).disabled = false;
    payload = payload + "-" + rooms[indexRoom].ID[indexID].TYPE;

    document.getElementById("statusbar").value = payload;
    socket.emit("command", payload);
  }
  if (val == "dimmer") {
    var slider = document.getElementById("slider" + rooms[indexRoom].ID[indexID].DEVICE_ID).value;
    payload = payload + "-dimmer-" + rooms[indexRoom].ID[indexID].TYPE + "-" + slider;

    document.getElementById("statusbar").value = payload;
    socket.emit("command", payload);
  }
  if (val == "sendTime") {
    var ledtime = document.getElementById("time" + rooms[indexRoom].ID[indexID].DEVICE_ID).value;
    payload = payload + "-wakeUpLedTime-" + rooms[indexRoom].ID[indexID].TYPE + "-" + ledtime;

    document.getElementById("statusbar").value = payload;
    socket.emit("command", payload);
  }
}

socket.on("message", (data) => {
  console.log(data);
});

socket.on("reloadPage", () => {
  fetch("./json/rooms.json")
    .then((response) => response.json())
    .then((data) => {
      rooms = data;
      console.log(rooms);
      openRoom(selectedRoom);
    });
});

function showSettingsMenu() {
  document.getElementById("settingsMenu").style.display = "block";
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
  settings.wakeUp.Time = weekValue;
  socket.emit("settings", settings);
}

function showAddDeviceMenu() {
  createAddDeviceMenu();
  document.getElementById("addDevice").style.display = "block";
}

function hideAddDeviceMenu() {
  document.getElementById("addDevice").style.display = "none";
}

function showDeviceMenu() {
  document.getElementById("deviceMenu").style.display = "block";
  // make list of connected devices
}

function hideDeviceMenu() {
  document.getElementById("deviceMenu").style.display = "none";
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
  let data = payload.split("-");
  foundDevices[foundDevicesIndex] = data[0];
});

function findNewDevices() {
  foundDevices = 0;
  foundDevicesIndex = 0;
  socket.emit("newDevice", "pingForNewDevices");
}

function createAddDeviceMenu() {
  findNewDevices();
  var AddDeviceRoom = '<option value="" disabled selected hidden>Select Room</option>';
  for (var i = 0; i < rooms.length; i++) {
    AddDeviceRoom += "<option>" + rooms[i].name + "</option>";
  }
  var AddDeviceType = '<option value="" disabled selected hidden>Select Type</option>';
  for (var i = 0; i < settings.Type.length; i++) {
    AddDeviceType += "<option>" + settings.Type[i] + "</option>";
  }
  if (foundDevices > 0) {
    var SelectDevice = '<option value="" disabled selected hidden>Select Device</option>';
    for (var i = 0; i < settings.Device.length; i++) {
      SelectDevice += "<option>" + settings.Device[i].Name + "</option>";
    }
  } else {
    console.log("ErroMessage: No device found");
    // TO BE ADDED MESSAGE UNDER FORM
  }

  document.getElementById("AddDeviceRoom").innerHTML = AddDeviceRoom;
  document.getElementById("AddDeviceType").innerHTML = AddDeviceType;

  document.getElementById("SelectDevice").innerHTML = SelectDevice;
}

function addEventListener() {
  const menuButtonSettings = document.querySelector(".menu-button-settings");
  let menuSettingOpen = false;
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
