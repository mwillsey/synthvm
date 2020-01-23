'use strict';

console.log("Loaded!")

// let keyboard = document.querySelector(".keyboard");
// let wavePicker = document.querySelector("select[name='waveform']");
// let volumeControl = document.querySelector("input[name='volume']");

// function setVolume(event) {
//     masterGainNode.gain.value = volumeControl.value
// }

// let audioContext = new (window.AudioContext || window.webkitAudioContext);
// let oscList = [];
// let masterGainNode = audioContext.createGain();
// masterGainNode.connect(audioContext.destination);
// setVolume();
// // volumeControl.addEventListener("change", setVolume, false);

// let noteFreq = null;
// let customWaveform = null;
// let sineTerms = null;
// let cosineTerms = null;

// const A4_REFERENCE = 440;
// const HALF_STEP = Math.pow(2, 1/12);
// function note_freq(n) {
//     return A4_REFERENCE * Math.pow(HALF_STEP, n)
// }

// let osc = audioContext.createOscillator();
// osc.connect(masterGainNode);

// function playTone(freq) {
//     console.log("Playing", freq, "hz");
//     let osc = audioContext.createOscillator();
//     osc.connect(masterGainNode);

//     let type = wavePicker.options[wavePicker.selectedIndex].value;

//     osc.type = type;
//     osc.frequency.value = freq;
//     osc.start();

//     return osc;
// }

// async function playToneFor(freq, ms) {
//     let tone = playTone(freq);
//     await new Promise(r => setTimeout(r, ms));
//     tone.stop();
// }

// async function scale(base, duration, steps) {
//     let note = base;
//     for (const step of steps) {
//         await playToneFor(note_freq(note), duration);
//         note += step;
//     }
//     await playToneFor(note_freq(note), duration * 2);
// }

// let majorScale = base => scale(base, 100, [2, 2, 1, 2, 2, 2, 1]);
// let minorScale = base => scale(base, 100, [2, 1, 2, 2, 1, 2, 2]);

// // | inst | addr |
// // 7 6 5 4 3 2 1 0

// const INSTRUCTIONS = [
//     'load',
//     'store',
//     'add',
//     'jump',
// ];

// const ADDR_MODES = [
//     'imm',
//     'abs',
//     'rel',
// ];

// function decode(instr) {
//     return [INSTRUCTIONS[instr >> 4], ADDR_MODES[instr & 4]];
// }

// class Machine {
//     constructor() {
//         this.mem = new Int8Array(256);
//         this.pc = 0;
//         this.a = 0;

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
    console.log("Playing", freq, "hz");
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

// | inst | addr |
// 7 6 5 4 3 2 1 0

const INSTRUCTIONS = [
    'load',
    'store',
    'add',
    'jump',
];

const ADDR_MODES = [
    'imm',
    'abs',
    'rel',
];

function decode(instr) {
    return [INSTRUCTIONS[instr >> 4], ADDR_MODES[instr & 4]];
}

class Machine {
    constructor() {
        this.mem = new Int8Array(256);
        this.pc = 0;
        this.a = 0

        let rootMemNode = document.querySelector("#memory");

        this.memNodes = [];
        for (let i = 0; i < 256; i++) {
            let node = document.createElement("li");
            node.innerText = 0;
            this.memNodes.push(node);
            rootMemNode.appendChild(node);
        }
    }

    read(addr) {
        return this.mem[addr];
    }
    write(addr, val) {
        this.memNodes[addr].innerText = val;
        this.mem[addr] = val;
    }

    execute(kind, mode, arg) {
        let operand = null;
        switch(mode) {
        case 'imm':
            operand = arg;
            break;
        case 'abs':
            operand = this.mem[arg];
            break;
        case 'rel':
            operand = this.mem[this.a + arg];
            break;
        default:
            console.error("Unknown addressing mode");
        }

        switch(kind) {
        case 'load':
            this.a = operand;
            break;
        case 'store':
            this.write(this.operand, this.a);
            break;
        case 'add':
            this.a += this.operand;
            break;
        case 'jump':
            this.pc = this.operand;
            break;
        default:
            console.error("Unknown addressing mode");
        }
    }

    step() {
        let instr = this.mem[this.pc];
        let arg = this.mem[this.pc + 1];
        let kind, mode = decode(instr);
        this.pc += 2;
        this.execute(kind, mode, arg);
    }
}

let machine = new Machine();
