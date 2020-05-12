$(function() {
  let body = document.getElementsByTagName("body")[0];
  let imgKeyboard = document.getElementById("imgKeyboard");
  let oKeyboard = null;
  let oscillatorArr = Array(200)
  let fUserHasTyped = false;
  let audioCtx = new(window.AudioContext || window.webkitAudioContext)();

  var volume = audioCtx.createGain();
  volume.connect(audioCtx.destination);
  volume.gain.value = 0.3

  // Create a compressor node
  var compressor = audioCtx.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-50, audioCtx.currentTime);
  compressor.knee.setValueAtTime(40, audioCtx.currentTime);
  compressor.ratio.setValueAtTime(12, audioCtx.currentTime);
  compressor.attack.setValueAtTime(0, audioCtx.currentTime);
  compressor.release.setValueAtTime(0.25, audioCtx.currentTime);
  // connect the AudioBufferSourceNode to the destination
  compressor.connect(volume);

function playFreq(frequency) {
  // create Oscillator node

  var oscillator = audioCtx.createOscillator();

  oscillator.type = 'sine';
  oscillator.frequency.value = frequency; // value in hertz
  oscillator.connect(compressor);
  oscillator.start();

  return function() {
      oscillator.stop();
      delete oscillator;
      delete volume;
  }
}

function playNote(note) {
  let frequency = noteToFreq[note-24]
  console.log(frequency)
  return playFreq(frequency)
}

  function GetKeyboard(file) {
    fetch(file)
      .then(data => data.json())
      .then(json => { oKeyboard = json; });
  }

  function KeyCodeToNote(keyCode){
    let keyPosition = GetKey(keyCode)
    keyPosition = keyPosition.slice(1,3)
    keyPosition[0] = Math.floor(keyPosition[0])
    keyPosition[0] = keyPosition[1] <= 2 ? keyPosition[0]  : keyPosition[0] - 1
    keyPosition[1] = 4-keyPosition[1]
    noteNumber = 61 + (keyPosition[0] * 3) + keyPosition[1] // z is C4
    console.log(noteNumber,keyPosition)
    return noteNumber
  }

  function GetKey(keyCode) {
    let oLayout = oKeyboard.Layout;
    let top = oLayout.length;
    let bottom = -1;
    let middle;
    while (top - bottom > 1) {
      middle = parseInt((top + bottom) / 2);
      if (oLayout[middle][0] < keyCode)
        bottom = middle;
      else
        top = middle;
    }
    return (oLayout[top][0] == keyCode) ? oLayout[top] : null;
  }

  function ShowKey(keyCode) {
    let fResult = false;
    HideHintUserToType();
    if (GetKeyOverlay(keyCode) === null) {
      let rgKey = GetKey(keyCode);
      let pxDefaultKeyWidth = Number(imgKeyboard.naturalWidth) / oKeyboard.Width;
      let pxDefaultKeyHeight = Number(imgKeyboard.naturalHeight) / oKeyboard.Height;
      if(rgKey != null) {
        if(rgKey[1].length != null) {
          for(let iKeyLocation = 0; iKeyLocation < rgKey[1].length; ++iKeyLocation){
            AppendOverlayAtLocation(keyCode, pxDefaultKeyWidth, pxDefaultKeyHeight, rgKey[1][iKeyLocation][0], rgKey[1][iKeyLocation][1], rgKey[1][iKeyLocation][2], rgKey[1][iKeyLocation][3]);
          }
        }else{
          AppendOverlayAtLocation(keyCode, pxDefaultKeyWidth, pxDefaultKeyHeight, rgKey[1], rgKey[2], rgKey[3], rgKey[4]);
        }
        fResult = true;
      }
    }
    return fResult;
  }

  function AppendOverlayAtLocation(keyCode, unitX, unitY, top, left, width, height) {
    $(`<img id='overlay${keyCode}'
        class='KeyDownOverlay'
        src='assets/KeyOverlay.gif'
        style='
          position: absolute;
          left: ${(1.0 + Math.round(unitX * top))}px;
          top: ${(1.0 + unitY * left)}px;
          width: ${(-1.0 + unitX * width)}px;
          height: ${(-1.0 + unitY * height)}px;
          opacity: 0.5;
        ' />`)
    .appendTo($("#divKeyboard"));
  }

  function HideKey(keyCode) {
    let fResult = false;
    let rgKey = GetKey(keyCode);
    if (rgKey != null) {
      GetKeyOverlay(keyCode).remove();
      if (rgKey[1].length != null) {
        for (let iKeyLocations = 1; iKeyLocations < rgKey[1].length; ++iKeyLocations){
          GetKeyOverlay(keyCode).remove();
        }
      }
      fResult = true;
    }
    return fResult;
  }

  function GetKeyOverlay(keyCode) {
    return document.getElementById(`overlay${keyCode}`);
  }

  function HandleKeyDown(event) {
    if (!fUserHasTyped) {
      HideHintUserToType();
      fUserHasTyped = true;
    }
    if (ShowKey(event.keyCode)){
      event.preventDefault();
    }
    let key = KeyCodeToNote(event.keyCode)
    console.log(event)
    if(oscillatorArr[event.keyCode] == null) {
      oscillatorArr[event.keyCode] = playNote(key)
    }
  }

  function HandleKeyUp(event) {
    oscillatorArr[event.keyCode]()
    oscillatorArr[event.keyCode] = null
    if (HideKey(event.keyCode)){
      event.preventDefault();
    }
  }

  body.onkeydown = (event) => HandleKeyDown(event);
  body.onkeyup = (event) => HandleKeyUp(event);
  window.onfocus = () => HandleFocus();
  window.onblur = () => HandleBlur();

  function HandleFocus() {
    HideHintUserToType();
  }

  function HandleBlur() {
    document.querySelectorAll("#divKeyboard img[id^=overlay]").forEach(e => e.remove());
    ShowHintUserToType();
  }

  function ShowHintUserToType() {
    if (!fUserHasTyped) {
      ShowMessage("divTypeToUse", "Type To Use");
    }
  }

  function HideHintUserToType() {
    HideMessage("divTypeToUse");
  }

  function ShowMessage(idMessage, strMessage) {
    if ($("#" + idMessage).length == 0) {
      let messageWidth = 200;
      let messageHeight = 40;
      $(".MultiKeyDisplayMessage").each(function(i) {
        HideMessage(this.id)
      });
      $("<span id='" + idMessage + "' " + "class='MultiKeyDisplayMessage' " + "style='position:absolute; left:0px; top:0px; " + "width:" + imgKeyboard.naturalWidth + "px; " + "height:" + imgKeyboard.naturalHeight + "px; " + "background: grey; " + "filter:alpha(opacity=80); opacity:0.8;' >" + "<span " + "style='position:absolute; left:" + ((imgKeyboard.naturalWidth - messageWidth) / 2) + "px; " + "top:" + ((imgKeyboard.naturalHeight - messageHeight) / 2) + "px; " + "width:" + messageWidth + "px; " + "height:" + messageHeight + "px; " + "text-align:center; " + "font-size:24pt; " + "background: lightgrey;' >" + strMessage + "</span></span>").click(function() {
        window.focus();
      }).appendTo($("#divKeyboard"));
    }
  }

  function HideMessage(idMessage) {
    window.focus();
    $("#" + idMessage).fadeOut("normal", function() {
      $(this).remove();
    });
  }

  if (imgKeyboard.getAttribute("keyboardname") == "FullSizeDefault") {
    imgKeyboard.src = "assets/KeyboardFullSizeDefault.gif";
    GetKeyboard("assets/defaultFullSizeKeyMap.js");
  } else {
    imgKeyboard.src = "assets/KeyboardDefault.gif";
    GetKeyboard("assets/defaultKeyMap.js");
  }

  imgKeyboard.onload = () => { ShowHintUserToType(); };

});

let noteToFreq=[
0,
27.5000,
29.1353,
30.8677,
32.7032,
34.6479,
36.7081,
38.8909,
41.2035,
43.6536,
46.2493,
48.9995,
51.9130,
55.0000,
58.2705,
61.7354,
65.4064,
69.2957,
73.4162,
77.7817,
82.4069,
87.3071,
92.4986,
97.9989,
103.826,
110.000,
116.541,
123.471,
130.813,
138.591,
146.832,
155.563,
164.814,
174.614,
184.997,
195.998,
207.652,
220.000,
233.082,
246.942,
261.626,
277.183,
293.665,
311.127,
329.628,
349.228,
369.994,
391.995,
415.305,
440.000,
466.164,
493.883,
523.251,
554.365,
587.330,
622.254,
659.255,
698.456,
739.989,
783.991,
830.609,
880.000,
932.328,
987.767,
1046.50,
1108.73,
1174.66,
1244.51,
1318.51,
1396.91,
1479.98,
1567.98,
1661.22,
1760.00,
1864.66,
1975.53,
2093.00,
2217.46,
2349.32,
2489.02,
2637.02,
2793.83,
2959.96,
3135.96,
3322.44,
3520.00,
3729.31,
3951.07,
4186.01
]