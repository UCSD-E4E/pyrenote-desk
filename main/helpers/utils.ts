import Papa from 'papaparse'


//https://stackoverflow.com/questions/52240221/download-save-csv-file-papaparse
function downloadCSV(array, filename){
    filename = "LABELED_" + filename
    var csv = Papa.unparse(array);

    var csvData = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
    var csvURL =  null;
    csvURL = window.URL.createObjectURL(csvData);

    var tempLink = document.createElement('a');
    tempLink.href = csvURL;
    tempLink.setAttribute('download', filename);
    tempLink.click();
}

//https://stackoverflow.com/a/29855282
const pathJoin = (parts, sep='/') => parts.join(sep).replace(new RegExp(sep+'{1,}', 'g'), sep);

//https://coolors.co/031d44-04395e-70a288-dab785-d5896f
const background_colors_for_verifcation = {
    "": "none",
    "PRESENT": "#70A288",
    "ABSENT": "#D5896F"
}

function changeBackground(div, label) {
    div.style.background = background_colors_for_verifcation[label]
}

function updateConfidence(wavesurfer_container, row_data) {
    if ((row_data["USER_CONFIDENCE"] !== "")) {
        console.log(wavesurfer_container.querySelector("#confidence"), row_data["USER_CONFIDENCE"])
        wavesurfer_container.querySelector("#confidence").value = row_data["USER_CONFIDENCE"]
    }
}

async function addAudio(row_data, i, wavesurferArray, WaveSurfer, Spectrogram) {
    const wavesurfer_container = document.getElementById(`wavesurfer_${i}`);
    wavesurfer_container.style.display = "block";
    changeBackground(wavesurfer_container, row_data["VERIFY_ID"])

    if (wavesurfer_container.innerHTML !== "") {
        updateConfidence(wavesurfer_container, row_data)
        return
    }

    //add label for that species
    const para = document.createElement("p");
    para.style.textAlign  = "center"
    para.style.width = "100%"
    const node = document.createTextNode(`Species: ${row_data["MANUAL ID"]}`);
    para.appendChild(node);
    wavesurfer_container.append(para)

    //create audio visualization for each row
    const filePath = pathJoin([row_data["FOLDER"], row_data["IN FILE"]])
    console.log(filePath)
    //TODO!!! NEED TO ADD OFFSET AND DURATION
    const AudioContext = window.AudioContext;
    var audioCtx = new AudioContext();
    var newBuffer = await fetch(filePath).then(response => response.arrayBuffer()).then(buffer => audioCtx.decodeAudioData(buffer)).then(buffer => {
        console.log(buffer)
        let newBuffer = []
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            // This gives us the actual ArrayBuffer that contains the data
            const nowBuffering = buffer.getChannelData(channel);
            const start = buffer.sampleRate * row_data["OFFSET"]
            const duration = buffer.sampleRate * row_data["DURATION"]
            //console.log(nowBuffering.slice(start, start + duration))
            newBuffer.push(nowBuffering.slice(start, start + duration))
        }
        return newBuffer
        
    });

    const wavesurfer = WaveSurfer.create({
        container: "#" + wavesurfer_container.id,
        waveColor: '#4F4A85',
        progressColor: '#383351',
        url: filePath,
        peaks: newBuffer
    })

    wavesurfer.registerPlugin(
        Spectrogram.create({
            labels: true,
            height: 200,
        }),
    )

    //add pause and play controls
    const controls = document.getElementById("original_form") as HTMLElement | null;
    const clonedControls = controls.cloneNode(true);
    controls.id = "controls_"  + wavesurfer_container.id
    controls.style.display = "block"
    const play_button = controls.querySelector(".media_controls")
    play_button.id = "play_"  + wavesurfer_container.id
    
    //pauses all wavesurfers elements then handles pausing/playing new wavesurfer elemnt
    play_button.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        const button_pressed = Number(target.id.split("_")[2])
        //console.log("PLAYPAUASE", wavesurfer.isPlaying())
        wavesurfer.playPause()
        //console.log("PLAYPAUASE", wavesurfer.isPlaying())
        wavesurferArray.forEach((wavesufer_sub, idx) => {
            if (idx != button_pressed) {
                console.log("PAUSE", idx != button_pressed, idx, button_pressed, wavesufer_sub.isPlaying())
                //wavesufer_sub.pause()
            } else {
                console.log("PLAYPAUASE", wavesufer_sub.isPlaying())
                //wavesufer_sub.playPause()
            }
        });
        
       
        console.log("PLAYPAUASE", wavesurfer.isPlaying())
        console.log("=================================")
        // console.log("PLAUSE", button_pressed, wavesurferArray.length, wavesurfer)
    })

    // //handle setting verifcation of data
    // const verify_settings = controls.querySelector(
    //     ".verification_controls"
    // ).querySelectorAll(".radio")
    // verify_settings[0].onchange = "handleVerify(this)"
    
    


    //add controls and save wavesurfer object for later use
    wavesurfer_container.append(controls)
    updateConfidence(wavesurfer_container, row_data)
    wavesurferArray.push(wavesurfer)
    //return wavesurferArray
}


//ADD WAVESURFER HANDLING IF SLOWDOWN OCCURS
function removeAudio(i, wavesurferArray) {
    if (i < wavesurferArray.length) {
        // const oldWavesurferObj = wavesurferArray[i];
        // delete oldWavesurferObj.destory()
        document.getElementById(`wavesurfer_${i}`).style.display = "none";
        //wavesurferArray[i] = null
    }
}

function removeALL(wavesurferArray) {
    for(let i =0; i< wavesurferArray.length; i++) {
        const wavesurfer_elm = document.getElementById(`wavesurfer_${i}`)
        changeBackground(wavesurfer_elm, "blank")
        wavesurfer_elm.style.display = "none";
        const wavesurfer_obj = wavesurferArray[i]
        wavesurferArray[i] = null
        //delete wavesurfer_obj
        wavesurfer_obj.destory()
        wavesurfer_elm.remove()
        console.log(document.getElementById(`wavesurfer_${i}`))
    }
}

export default {
    removeALL,
    removeAudio,
    addAudio,
    updateConfidence,
    changeBackground,
    downloadCSV
};