var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import Papa from 'papaparse';
//https://stackoverflow.com/questions/52240221/download-save-csv-file-papaparse
function downloadCSV(array, filename) {
    filename = "LABELED_" + filename;
    var csv = Papa.unparse(array);
    var csvData = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var csvURL = null;
    csvURL = window.URL.createObjectURL(csvData);
    var tempLink = document.createElement('a');
    tempLink.href = csvURL;
    tempLink.setAttribute('download', filename);
    tempLink.click();
}
//https://stackoverflow.com/a/29855282
var pathJoin = function (parts, sep) {
    if (sep === void 0) { sep = '/'; }
    return parts.join(sep).replace(new RegExp(sep + '{1,}', 'g'), sep);
};
//https://coolors.co/031d44-04395e-70a288-dab785-d5896f
var background_colors_for_verifcation = {
    "": "none",
    "PRESENT": "#70A288",
    "ABSENT": "#D5896F"
};
function changeBackground(div, label) {
    div.style.background = background_colors_for_verifcation[label];
}
function updateConfidence(wavesurfer_container, row_data) {
    if ((row_data["USER_CONFIDENCE"] !== "")) {
        console.log(wavesurfer_container.querySelector("#confidence"), row_data["USER_CONFIDENCE"]);
        wavesurfer_container.querySelector("#confidence").value = row_data["USER_CONFIDENCE"];
    }
}
function addAudio(row_data, i, wavesurferArray, WaveSurfer, Spectrogram) {
    return __awaiter(this, void 0, void 0, function () {
        var wavesurfer_container, para, node, filePath, AudioContext, audioCtx, newBuffer, wavesurfer, controls, clonedControls, play_button;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    wavesurfer_container = document.getElementById("wavesurfer_".concat(i));
                    wavesurfer_container.style.display = "block";
                    changeBackground(wavesurfer_container, row_data["VERIFY_ID"]);
                    if (wavesurfer_container.innerHTML !== "") {
                        updateConfidence(wavesurfer_container, row_data);
                        return [2 /*return*/];
                    }
                    para = document.createElement("p");
                    para.style.textAlign = "center";
                    para.style.width = "100%";
                    node = document.createTextNode("Species: ".concat(row_data["MANUAL ID"]));
                    para.appendChild(node);
                    wavesurfer_container.append(para);
                    filePath = pathJoin([row_data["FOLDER"], row_data["IN FILE"]]);
                    console.log(filePath);
                    AudioContext = window.AudioContext;
                    audioCtx = new AudioContext();
                    return [4 /*yield*/, fetch(filePath).then(function (response) { return response.arrayBuffer(); }).then(function (buffer) { return audioCtx.decodeAudioData(buffer); }).then(function (buffer) {
                            console.log(buffer);
                            var newBuffer = [];
                            for (var channel = 0; channel < buffer.numberOfChannels; channel++) {
                                // This gives us the actual ArrayBuffer that contains the data
                                var nowBuffering = buffer.getChannelData(channel);
                                var start = buffer.sampleRate * row_data["OFFSET"];
                                var duration = buffer.sampleRate * row_data["DURATION"];
                                //console.log(nowBuffering.slice(start, start + duration))
                                newBuffer.push(nowBuffering.slice(start, start + duration));
                            }
                            return newBuffer;
                        })];
                case 1:
                    newBuffer = _a.sent();
                    wavesurfer = WaveSurfer.create({
                        container: "#" + wavesurfer_container.id,
                        waveColor: '#4F4A85',
                        progressColor: '#383351',
                        url: filePath,
                        peaks: newBuffer
                    });
                    wavesurfer.registerPlugin(Spectrogram.create({
                        labels: true,
                        height: 200,
                    }));
                    controls = document.getElementById("original_form");
                    clonedControls = controls.cloneNode(true);
                    controls.id = "controls_" + wavesurfer_container.id;
                    controls.style.display = "block";
                    play_button = controls.querySelector(".media_controls");
                    play_button.id = "play_" + wavesurfer_container.id;
                    //pauses all wavesurfers elements then handles pausing/playing new wavesurfer elemnt
                    play_button.addEventListener("click", function (e) {
                        var target = e.target;
                        var button_pressed = Number(target.id.split("_")[2]);
                        //console.log("PLAYPAUASE", wavesurfer.isPlaying())
                        wavesurfer.playPause();
                        //console.log("PLAYPAUASE", wavesurfer.isPlaying())
                        wavesurferArray.forEach(function (wavesufer_sub, idx) {
                            if (idx != button_pressed) {
                                console.log("PAUSE", idx != button_pressed, idx, button_pressed, wavesufer_sub.isPlaying());
                                //wavesufer_sub.pause()
                            }
                            else {
                                console.log("PLAYPAUASE", wavesufer_sub.isPlaying());
                                //wavesufer_sub.playPause()
                            }
                        });
                        console.log("PLAYPAUASE", wavesurfer.isPlaying());
                        console.log("=================================");
                        // console.log("PLAUSE", button_pressed, wavesurferArray.length, wavesurfer)
                    });
                    // //handle setting verifcation of data
                    // const verify_settings = controls.querySelector(
                    //     ".verification_controls"
                    // ).querySelectorAll(".radio")
                    // verify_settings[0].onchange = "handleVerify(this)"
                    //add controls and save wavesurfer object for later use
                    wavesurfer_container.append(controls);
                    updateConfidence(wavesurfer_container, row_data);
                    wavesurferArray.push(wavesurfer);
                    return [2 /*return*/];
            }
        });
    });
}
//ADD WAVESURFER HANDLING IF SLOWDOWN OCCURS
function removeAudio(i, wavesurferArray) {
    if (i < wavesurferArray.length) {
        // const oldWavesurferObj = wavesurferArray[i];
        // delete oldWavesurferObj.destory()
        document.getElementById("wavesurfer_".concat(i)).style.display = "none";
        //wavesurferArray[i] = null
    }
}
function removeALL(wavesurferArray) {
    for (var i = 0; i < wavesurferArray.length; i++) {
        var wavesurfer_elm = document.getElementById("wavesurfer_".concat(i));
        changeBackground(wavesurfer_elm, "blank");
        wavesurfer_elm.style.display = "none";
        var wavesurfer_obj = wavesurferArray[i];
        wavesurferArray[i] = null;
        //delete wavesurfer_obj
        wavesurfer_obj.destory();
        wavesurfer_elm.remove();
        console.log(document.getElementById("wavesurfer_".concat(i)));
    }
}
export default {
    removeALL: removeALL,
    removeAudio: removeAudio,
    addAudio: addAudio,
    updateConfidence: updateConfidence,
    changeBackground: changeBackground,
    downloadCSV: downloadCSV
};
