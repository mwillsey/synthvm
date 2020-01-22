
console.log("Loaded!")

let keyboard = document.querySelector(".keyboard");
let wavePicker = document.querySelector("select[name='waveform']");
let volumeControl = document.querySelector("input[name='volume']");

function setVolume(event) {
    masterGainNode.gain.value = volumeControl.value
}

let audioContext = new (window.AudioContext || window.webkitAudioContext);
let oscList = [];
let masterGainNode = audioContext.createGain();
masterGainNode.connect(audioContext.destination);
setVolume();
// volumeControl.addEventListener("change", setVolume, false);

let noteFreq = null;
let customWaveform = null;
let sineTerms = null;
let cosineTerms = null;

const A4_REFERENCE = 440;
const HALF_STEP = Math.pow(2, 1/12);
function note_freq(n) {
    return A4_REFERENCE * Math.pow(HALF_STEP, n)
}

let osc = audioContext.createOscillator();
osc.connect(masterGainNode);

function playTone(freq) {
    // console.log("Playing", freq, "hz");
    let osc = audioContext.createOscillator();
    osc.connect(masterGainNode);

    let type = wavePicker.options[wavePicker.selectedIndex].value;

    osc.type = type;
    osc.frequency.value = freq;
    osc.start();

    return osc;
}

async function playToneFor(freq, ms) {
    let tone = playTone(freq);
    await new Promise(r => setTimeout(r, ms));
    tone.stop();
}

async function scale(base, duration, steps) {
    let note = base;
    for (const step of steps) {
        await playToneFor(note_freq(note), duration);
        note += step;
    }
    await playToneFor(note_freq(note), duration * 2);
}

let majorScale = base => scale(base, 100, [2, 2, 1, 2, 2, 2, 1]);
let minorScale = base => scale(base, 100, [2, 1, 2, 2, 1, 2, 2]);

// main();
