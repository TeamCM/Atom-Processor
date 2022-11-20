const bus = new Bus();
const mem = new Memory(0x800);
const rom = new ROM(0xf7ff);
const followSection0 = document.querySelector("#followSection0");
const noUpdateStackEl = document.querySelector("#noUpdateStack");
const noUpdateMemoryEl = document.querySelector("#noUpdateMemory");
const intervalTimeout = document.querySelector("#interval");
const stepTimes = document.querySelector("#stepTimes");
const ramViewer = document.querySelector("#ram-viewer");
const regel = document.querySelectorAll("#rvalues td");
const noUpdateInfo = document.querySelector("#noUpdateInfo");
const stackEl = document.querySelector("#stack");
const sregsEl = document.querySelectorAll("#srvalues td");
const uploadEl = document.querySelector("input[type=\"file\"]");
const downloadEl = document.querySelector("#download");

const statusInfo = document.querySelector("#status");
const registersTable = document.querySelector("#registers");
const sregsTable = document.querySelector("#sregs");

const registersColors = [
    "#F44",
    "#FF4",
    "#4FF",
    "#F00",
    "#555"
];
const cpu = new Processor();
let interval,offset = 0x800,saveName = "lcode";;

bus.addComponent("ram",0,0x800,mem);
bus.addComponent("rom",0x800,0xffff,rom);
cpu.bus = bus;
cpu.defaultIp = 0x800;
cpu.maskable_interrupt_address = 0x803;
cpu.non_maskable_inerrupt_address = 0x805;

monaco.languages.register({
    id: "assembly"
});

monaco.languages.setMonarchTokensProvider("assembly", {
    tokenizer: {
        root: [
            [/((lda)|(ldx)|(ldy)|(sta)|(stx)|(sty))/i, "memory"],
            [/((pusha)|(pushx)|(pushy)|(popa)|(popx)|(popy))/i, "stack"],
            [/".*"/i, "string"],
            [/(db)/i, "define"],
            [/((0x)|(0b))|([0-9])/i, "number"],
            [/(jmp)|(int)|(reti)|(call)|(ret)|(jz)|(jc)|(jnz)|(jnc)|(hlt)/i, "control"],
            [/(ada)|(adx)|(ady)|(sua)|(sux)|(suy)|(nana)|(nanx)|(nany)|(cma)|(cmx)|(cmy)/i, "math"],
            [/;.{0,}/i, "comment"],
            [/(ccf)|(czf)|(cif)|(scf)|(szf)|(sif)/i, "flag"]
        ]
    }
});


monaco.editor.defineTheme("asmtheme", {
    base: "vs",
    inherit: false,
    rules: [
        {token: "memory", foreground: "aa0000"},
        {token: "stack", foreground: "000088", fontStyle: "bold"},
        {token: "define", foreground: "00cc00"},
        {token: "number", foreground: "008800"},
        {token: "string", foreground: "ff8000", fontStyle: "bold"},
        {token: "control", foreground: "0000ff"},
        {token: "register", foreground: "aa0000", fontStyle: "bold"},
        {token: "rname", foreground: "aa0000"},
        {token: "math", foreground: "00aa00", fontStyle: "bold"},
        {token: "comment", foreground: "008800", fontStyle: "bold"},
        {token: "flag", foreground: "aa0000", fontStyle: "bold"}
    ],
    colors: {
        "editor.foreground": "#000000"
    }
});

const editor = monaco.editor.create(document.querySelector("#code"), {
    theme: "asmtheme",
    language: "assembly",
    value: "jmp main\n\nmain: ; insert your code here\nhlt"
});


function updateRegistersColors(){
    const regnames = document.querySelector("#registers tr").children;
    for(let i=0;i<regnames.length;i++){
        const reg = regnames[i];
        reg.style.backgroundColor = registersColors[i];
    }
}


function updateRegisters(){
    regel[0].textContent = cpu.registers[0];
    regel[1].textContent = cpu.registers[1];
    regel[2].textContent = cpu.registers[2];
    regel[3].textContent = cpu.registers[3];
    regel[4].textContent = cpu.registers[4].toString(2).padStart(8,"0");
}
function updateMemory(){
    let followSection0Value = followSection0.checked;
    let section = followSection0Value ? 0 : cpu.ip & 0xFF00;
    let k = 0;
    while(ramViewer.firstChild)
        ramViewer.firstChild.remove(); // forEach or for loops are glitched
    for(let i=0;i<16;i++){
        const tr = document.createElement("tr");
        for(let j=0;j<16;j++){
            const td = document.createElement("td");
            td.innerText = bus.read(section | k++);
            if(section === 0){
                if(cpu.registers[0] == k-1){
                    td.style.backgroundColor = registersColors[0];
                }
                if(cpu.registers[1] === k-1){
                    td.style.backgroundColor = registersColors[1];
                }
                if(cpu.registers[2] === k-1){
                    td.style.backgroundColor = registersColors[2];
                }
                if(cpu.registers[3] === k-1){
                    td.style.backgroundColor = registersColors[3];
                }
                if(cpu.registers[4] === k-1){
                    td.style.backgroundColor = registersColors[4];
                    td.style.color = "#eee";
                }
            }
            
            if(((cpu.ip & 0xFF) == k-1) && !followSection0Value){
                td.style.backgroundColor = "#44a";
                td.style.color = "#eee";
            }
            tr.append(td);
        }
        ramViewer.append(tr);
    }
}
/*const clearRightTrash = arr => {
    arr.reverse();
    while(!arr[0] && arr.length > 0) arr.shift();
    arr.reverse();
}*/

function updateStack(){
    while(stackEl.firstChild)
        stackEl.firstChild.remove();// forEach or for loops are glitched
    const stack = [];
    for(let i=255;i>=0;i--) stack.push(bus.read(i));
    //clearRightTrash(stack);
    console.log(255 - cpu.registers[3]);
    const okStack = stack.slice(0,255 - cpu.registers[3]);
    for(let i=0;i<stack.length;i++){
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.textContent = stack[i];
        tr.append(td);
        if((okStack.length - 1) === i)
            td.style.backgroundColor = "#0000ee";
        stackEl.append(tr);
    }
}

function updateSRegs(){
    sregsEl[0].textContent = !!cpu.getFlag(FLAGS.IF);
    sregsEl[1].textContent = !!cpu.getFlag(FLAGS.ZF);
    sregsEl[2].textContent = !!cpu.getFlag(FLAGS.CF);
}


function instruction2string(){
    let ip = cpu.ip;
    const instruction_name = COMMAND_NAME[cpu.bus.read(ip)];
    if(!instruction_name){
        return `DB ${cpu.bus.read(ip)}`;
    }
    let instruction = instruction_name;
    const model = OPMODELS[instruction_name];
    ip++;
    for(const type of model){
        if(type === 0){
            instruction += ` ${cpu.bus.read(ip)}`;
            ip++;
        }else if(type === 1){
            const val1 = cpu.bus.read(ip);
            ip++;
            const val2 = cpu.bus.read(ip);
            ip++;
            const value = (val1 << 8) | val2;
            instruction += ` 0x${value.toString("16").padStart(4,"0")}`;
        }
    }
    return instruction;
}
function updateInfo(){
    try{
        statusInfo.innerText = `IP: ${cpu.ip}\nCurrent instruction: ${instruction2string()}`;
    }catch(e){
        statusInfo.innerText = `Error getting information about cpu info.`;
        console.error(e);
    }
    updateRegisters();
    updateSRegs();
}
function updateAll(){
    if(!noUpdateInfo.checked) updateInfo();
    if(!noUpdateMemoryEl.checked) updateMemory();
    if(!noUpdateStackEl.checked) updateStack();
}

function reset(){
    cpu.reset();
    bus.reset();
}

function compile_str(){
    try{
        rom.loadROM(asm2code(editor.getValue(),offset));
        reset();
    }catch(e){
        console.log(e);
        const splitted = e.message.split(" ");
        if(e.constructor == SyntaxError){
            alert(`No op named ${splitted[0]} in line ${splitted[1]}`);
            console.log(e);
            editor.revealLine(parseInt(splitted[1]), 1);
            editor.setPosition(new monaco.Position(parseInt(splitted[1]), 0));
            editor.setSelection(new monaco.Selection(parseInt(splitted[1]), 0, parseInt(splitted[1]), Infinity));
        }else{
            alert(`No label ${splitted[0]}`);
            editor.revealLine(parseInt(splitted[1]), 1);
            editor.setPosition(new monaco.Position(parseInt(splitted[1]), 0));
            editor.setSelection(new monaco.Selection(parseInt(splitted[1]), 0, parseInt(splitted[1]), Infinity));
        }
    }
}

function downloadCode(){
    const url = "data:text/plain;charset=utf-8,"+encodeURIComponent(editor.getValue());
    downloadEl.download = "code.aasm";
    downloadEl.href = url;
    downloadEl.click();
}
function clearRightTrash2(arr){
    for(let i=arr.length-1;i>0;i--){
        if(arr[i]) break;
        arr.pop();
    }
}
function downloadBin(){
    const romCleaned = Array.from(rom);
    clearRightTrash2(romCleaned);
    const romVal = [];
    for(const val of romCleaned)
        romVal.push(String.fromCharCode(val));
    console.log(romCleaned, romVal.map(s => s.charCodeAt(0)));
    const url = "data:application/octet-stream,"+encodeURIComponent(romVal.join(""));
    downloadEl.download = "rom.bin";
    downloadEl.href = url;
    downloadEl.click();
}

function saveCode(){
    localStorage.setItem(saveName, editor.getValue());
}
function loadCode(noAlert){
    const code = localStorage.getItem(saveName);
    if(code) editor.setValue(code);
    else if(!noAlert) alert("No code saved!");
}

function getFiles(){
    return new Promise(r => {
        uploadEl.onchange = e => r(e.target.files);
        uploadEl.click();
    });
}
async function uploadCode(){
    const file = (await getFiles())[0];
    editor.setValue(await file.text());
    compile_str();
}
async function uploadBin(){
    const file = (await getFiles())[0];
    const text = await file.text();
    reset();
    rom.loadROM(text.split("").map(s => s.charCodeAt(0)));
    updateAll();
}


function makeStep(){
    for(let i=0;i<stepTimes.value;i++){
        if(cpu.halted) break;
        cpu.step();
    }
}
function intervalClear(){
    clearInterval(interval);
    interval = undefined;
}
function intervalStep(){
    if(interval) intervalClear();
    interval = setInterval(makeStep, parseInt(intervalTimeout.value));
}

noUpdateInfo.addEventListener("change", () => {
    if(noUpdateInfo.checked){
        statusInfo.classList.add("hidden");
        registersTable.classList.add("hidden");
        sregsTable.classList.add("hidden");
    }else{
        statusInfo.classList.remove("hidden");
        registersTable.classList.remove("hidden");
        sregsTable.classList.remove("hidden");
        updateInfo();
    }
});
noUpdateStackEl.addEventListener("change", () => {
    if(noUpdateStackEl.checked)
        while(stackEl.firstChild)
            stackEl.firstChild.remove();// forEach or for loops are glitched
});
noUpdateMemoryEl.addEventListener("change", () => {
    if(noUpdateMemoryEl.checked)
        while(ramViewer.firstChild)
            ramViewer.firstChild.remove();// forEach or for loops are glitched
});
cpu.addEventListener("update", updateAll);
followSection0.addEventListener("change", updateAll);
cpu.addEventListener("halted", intervalClear);

updateRegistersColors();
loadCode(true);
compile_str();