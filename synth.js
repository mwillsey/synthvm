'use strict';

console.log("Loaded!")

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

function encode(text) {
    let instrs = text.split(";").map(s => encode_one(s.trim()));
    return Array.prototype.concat.apply([], instrs);
}

function encode_one(text) {
    let words  = text.split(" ").map(s => s.trim()).filter(s => s != "");

    switch(words.length) {
    case 0:
        return [];

    case 1:
        let data = parseInt(words[0]);
        if (isNaN(data)) {
            throw `Invalid data: ${words[0]}`
        }
        console.log(`Encoded '${text}' to data ${data}`);
        return [data];

    case 3:
        let kind = INSTRUCTIONS.indexOf(words[0]);
        if (kind == -1) {
            throw `Invalid instruction: ${words[0]}`
        }
        let mode = ADDR_MODES.indexOf(words[1]);
        if (mode == -1) {
            throw `Invalid addressing mode: ${words[1]}`
        }

        let op = parseInt(words[2]);
        if (isNaN(op)) {
            throw `Invalid operand: ${words[2]}`
        }

        let instr = kind << 4 | mode;
        console.log(`Encoded '${text}' to instruction '0x${instr.toString(16)} ${op}'`);

        return [instr, op]

    default:
        throw `Invalid length of string: '${text}'`
    }
}

class Machine {
    constructor() {
        this.mem = new Int8Array(256);
        this.pc = 0;
        this.a = 0

        this.memSize = 256;

        let rootMemNode = document.querySelector("#memory");

        this.memNodes = [];
        for (let i = 0; i < this.memSize; i++) {
            let node = document.createElement("li");
            node.innerText = 0;
            this.memNodes.push(node);
            rootMemNode.appendChild(node);
        }

        this.aNode = document.getElementById("registerA");
        this.aNode.innerText = 0;
    }

    read(addr) {
        return this.mem[addr];
    }
    write(addr, val) {
        console.log("Writing", val, "to", addr);
        // TODO write a possible decode instr as text here
        this.memNodes[addr].innerText = val;
        this.mem[addr] = val;
    }
    setA(val) {
        this.a = val;
        this.aNode.innerText = val;
    }

    reset() {
        this.pc = 0;
        this.setA(0);
        for (let i = 0; i < this.memSize; i++) {
            this.write(i, 0);
        }
    }

    play() {
        let freq = note_freq(this.a);
        playToneFor(freq, 100);
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
            console.error("Unknown addressing mode:", mode);
        }

        console.log("Operand:", operand);

        switch(kind) {
        case 'load':
            this.setA(operand);
            this.play();
            break;
        case 'store':
            this.write(operand, this.a);
            break;
        case 'add':
            console.log('add', this.a, operand, this.a + operand);
            this.setA(this.a + operand);
            this.play();
            break;
        case 'jump':
            this.pc = operand;
            break;
        default:
            console.error("Unknown instruction kind:", kind);
        }
    }

    step() {
        let instr = this.mem[this.pc];
        let arg = this.mem[this.pc + 1];
        let [kind, mode] = decode(instr);

        console.log(`before pc: ${this.pc}, a: ${this.a},`, kind, mode, arg);
        this.pc += 2;
        this.execute(kind, mode, arg);
        console.log(`after pc: ${this.pc}, a: ${this.a},`, kind, mode, arg);
    }
}

let machine = new Machine();

function loadIntoMemory() {
    console.log("loading into memory");
}

function startMachine() {
    let text = document.getElementById("code").value;
    let code = encode(text);
    machine.reset();
    // TODO check code length
    for (let i = 0; i < code.length; i++) {
        machine.write(i, code[i]);
    }
}


document.getElementById("code").onkeyup = function() {
    console.log("parsing code", this.value);
    let code = encode(this.value);
};

document.getElementById("startMachine").onclick = startMachine;

document.getElementById("stepMachine").onclick = function() {
    machine.step();
}

startMachine();
