const bus = new Bus();
const cpu = new CPU();
const ramViewer = document.querySelector("#ram-viewer");

monaco.languages.register({
    id: "assembly"
});

monaco.languages.setMonarchTokensProvider("assembly", {
    tokenizer: {
        root: [
            [/((ldr)|(str))/i, "memory"],
            [/((push)|(pop))/i, "stack"],
            [/(movv)|(mov)/i, "register"],
            [/".*"/i, "string"],
            [/(db)/i, "define"],
            [/((0x)|(0b))|([0-9])/i, "number"],
            [/(jmpr)|(jmp)|(call)|(ret)|(jz)|(jnz)|(jc)|(jnc)|(jae)|(jb)|(jbe)|(hlt)/i, "control"],
            [/(ax)|(bx)|(cx)|(dx)|(sp)|(bp)/i, "rname"],
            [/(add)|(sub)|(inc)|(dec)/, "math"],
            [/;.{0,}/i, "comment"],
            [/(ccf)|(czf)|(cnf)|(cvf)/i, "flag"]
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
    value: "jmp main\ndb 4,0,\"Hello World!\",0\nprintf:\nret\nmain:\ncall printf\nhlt"
});

const regel = document.querySelectorAll("#rvalues td");
function updateRegisters(){
    regel[0].textContent = registers[0];
    regel[1].textContent = registers[1];
    regel[2].textContent = registers[2];
    regel[3].textContent = registers[3];
    regel[4].textContent = registers[4];
}
function updateMemory(){
    let section = cpu.ip & 0xFF00;
    let k = 0;
    while(ramViewer.firstChild)
        ramViewer.firstChild.remove();// forEach or for loops are glitched
    for(let i=0;i<16;i++){
        const tr = document.createElement("tr");
        for(let j=0;j<16;j++){
            const td = document.createElement("td");
            td.innerText = bus.read(section | k++);
            if((registers[0] & 0xFF00) == (cpu.ip & 0xFF00) && registers[0] == k-1){
                td.style.backgroundColor = "#f44";
            }
            if((registers[1] & 0xFF00) == (cpu.ip & 0xFF00) && registers[1] == k-1){
                td.style.backgroundColor = "#ff4";
            }
            if((registers[2] & 0xFF00) == (cpu.ip & 0xFF00) && registers[2] == k-1){
                td.style.backgroundColor = "#44f";
            }
            if((registers[3] & 0xFF00) == (cpu.ip & 0xFF00) && registers[3] == k-1){
                td.style.backgroundColor = "#4f4";
            }
            if((cpu.ip & 0xFF) == k-1){
                td.style.backgroundColor = "#44a";
            }
            tr.append(td);
        }
        ramViewer.append(tr);
    }
}
const clearRightTrash = arr => {
    arr.reverse();
    while(!arr[0] && arr.length > 0) arr.shift();
    arr.reverse();
}
const stackEl = document.querySelector("#stack");
function updateStack(){
    while(stackEl.firstChild)
        stackEl.firstChild.remove();// forEach or for loops are glitched
    const stack = [];
    for(let i=255;i>=0;i--) stack.push(bus.read(i));
    clearRightTrash(stack);
    const okStack = stack.slice(0,registers[4]);
    for(let i=0;i<stack.length;i++){
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.textContent = stack[i];
        tr.append(td);
        //if((registers[4] + i) == 254)
            //td.style.backgroundColor = "#0000ee";
        stackEl.append(tr);
    }
}
const sregsEl = document.querySelectorAll("#srvalues td");
function updateSRegs(){
    sregsEl[0].textContent = sregisters.zf;
    sregsEl[1].textContent = sregisters.cf;
    sregsEl[2].textContent = sregisters.nf;
    sregsEl[3].textContent = sregisters.vf;
}
const noUpdateStackEl = document.querySelector("#noUpdateStack");
noUpdateStackEl.addEventListener("change", () => {
    if(noUpdateStackEl.checked)
        while(stackEl.firstChild)
            stackEl.firstChild.remove();// forEach or for loops are glitched
});
const noUpdateMemoryEl = document.querySelector("#noUpdateMemory");
noUpdateMemoryEl.addEventListener("change", () => {
    if(noUpdateMemoryEl.checked)
        while(ramViewer.firstChild)
            ramViewer.firstChild.remove();// forEach or for loops are glitched
});
function updateAll(){
    try{
        document.querySelector("#status").innerText = `IP: ${cpu.ip}\nCycles: ${cpu.cycles}\nNext instruction: ${Object.entries(OPCODES).find(op => op[1] == bus.read(cpu.ip))[0]}`;
    }catch(e){
        document.querySelector("#status").innerText = `Error getting information about cpu info.`;
        console.error(e);
    }
    updateRegisters();
    if(!noUpdateMemoryEl.checked) updateMemory();
    if(!noUpdateStackEl.checked) updateStack();
    updateSRegs();
}
function makeStep(noupdateGUI){
    if(cpu.halted) return;
    cpu.clock(bus);
    if(!noupdateGUI) updateAll();
}
function run(){
    if(cpu.halted) return updateAll();
    for(let i=0;i<1024;i++) makeStep(true); // run a whole rom code
    setTimeout(run,0);
}
function fastRun(){
    while(!cpu.halted) makeStep(true);
    updateAll();
}
const finishEl = document.querySelector("#finish");
function reset(){
    cpu.reset(bus);
    updateAll();
}
function compile_str(){
    try{
        bus.loadROM(asm2code(editor.getValue()));
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
const downloadEl = document.querySelector("#download");
function downloadCode(){
    const url = "data:text/plain;charset=utf-8,"+encodeURIComponent(editor.getValue());
    downloadEl.download = "code.kasm";
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
    const romCleaned = Array.from(bus.rom);
    clearRightTrash2(romCleaned);
    const rom = [];
    for(const val of romCleaned)
        rom.push(String.fromCharCode(val));
    console.log(romCleaned, rom.map(s => s.charCodeAt(0)));
    const url = "data:application/octet-stream,"+encodeURIComponent(rom.join(""));
    console.log(url);
    downloadEl.download = "rom.bin";
    downloadEl.href = url;
    downloadEl.click();
}
function saveCode(){
    localStorage.setItem("lcode", editor.getValue());
}
function loadCode(noAlert){
    const code = localStorage.getItem("lcode");
    if(code) editor.setValue(code);
    else if(!noAlert) alert("No code saved!");
}
const uploadEl = document.querySelector("input[type=\"file\"]");
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
    bus.loadROM(text.split("").map(s => s.charCodeAt(0)));
    reset();
}
const intervalTimeout = document.querySelector("#interval");
let interval;
function intervalStep(){
    interval = setInterval(makeStep, parseInt(intervalTimeout.value));
}
function intervalClear(){
    clearInterval(interval);
}
function makeFullStep(){
    const opcode = bus.read(cpu.ip);
    while(bus.read(cpu.ip) == opcode) makeStep(true);
    updateAll();
}
loadCode(true);
compile_str();