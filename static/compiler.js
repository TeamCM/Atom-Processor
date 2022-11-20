// arg data for ops
// type 0, int
// type 1, address (2-byte int) (if parseInt does not work, it will be classified as label)
// type 2, register
const OPMODELS = {
    HLT: [],
    NOP: [],
    LDR: [2,1],
    STR: [2,1],
    MOV: [2,2],
    ADD: [2],
    SUB: [2],
    LSH: [0],
    RSH: [0],
    NOT: [],
    OR: [2],
    AND: [2],
    XOR: [2],
    PUSH: [2],
    POP: [2],
    JMP: [1],
    CALL: [1],
    RET: [],
    CMP: [2],
    JZ: [1],
    JNZ: [1],
    JC: [1],
    JNC: [1],
    JN: [],
    JNN: [],
    JV: [],
    JNV: [],
    INC: [2],
    DEC: [2],
    MOVV: [0,2],
    JMPR: [2],
    CCF: [],
    CZF: [],
    CNF: [],
    CVF: []
};

const toCharCode = str => Array.of(...str).map(s => s.charCodeAt(0));
function asm2code(str){
    const markedAddresses = {};
    const labelsAddresses = {};
    const lines = str.split("\n");
    const code = [];
    for(let i=0;i<lines.length;i++){
        const line = lines[i].replace(/;.{0,}/i, "").trimEnd(); // trimEnd removes \r
        if(/.{0,}:/i.test(line)){
            labelsAddresses[line.substring(0,line.length-1)] = 0x0800 + code.length;
            continue;
        }
        const splitted = line.split(" ");
        const op = splitted.shift().toUpperCase();
        const args = splitted.join(" ");
        const argsSplitted = args.split(",");
        if(!op) continue;
        if(op == "DB"){
            let readingString = false;
            let buf = "";
            for(let i=0;i<argsSplitted.length;i++){
                const startTrimmed = argsSplitted[i].trimStart();
                const endTrimmed = argsSplitted[i].trimEnd();
                console.log(startTrimmed, endTrimmed);
                if(startTrimmed[0] == "\"" && endTrimmed[endTrimmed.length-1] == "\""){
                    code.push(...toCharCode(JSON.parse(argsSplitted[i].trim())));
                }else if(startTrimmed[0] == "\""){
                    readingString = true;
                    buf = buf + argsSplitted[i];
                }else if(endTrimmed[endTrimmed.length-1] == "\""){
                    buf = buf + argsSplitted[i].trimEnd();
                    readingString = false;
                }else if(readingString){
                    buf = buf + argsSplitted[i];
                    code.push(...toCharCode(JSON.parse(buf)));
                    buf = "";
                    readingString = false;
                }else{
                    code.push(parseInt(argsSplitted[i]));
                }
            }
            continue;
        }
        const model = OPMODELS[op];
        if(!model) throw new SyntaxError(`${op} ${i+1}`);
        code.push(OPCODES[op]);
        
        for(let j=0;j<model.length;j++){
            const type = model[j];
            if(!type)
                code.push(parseInt(argsSplitted[j]) & 0xFF);
            else if(type == 1){
                if(parseInt(argsSplitted[j]))
                    code.push((parseInt(argsSplitted[j]) & 0xFF00) >> 8, parseInt(argsSplitted[j]) & 0xFF);
                else{
                    markedAddresses[code.length] = [argsSplitted[j], i];
                    code.push(0,0);
                }
            }else if(type == 2)
                code.push(REGISTERS[argsSplitted[j].trim().toUpperCase()]);
        }
    }
    for(const address in markedAddresses){
        const label = markedAddresses[address][0];
        const labelAddress = labelsAddresses[label];
        if(!labelAddress) throw Error(`${label} ${markedAddresses[address][1]}`);
        console.debug(`Convert label to address: ${address} wants a address to ${label}. Its ${labelAddress}`);
        code[parseInt(address)] = (labelAddress & 0xFF00) >> 8;
        code[parseInt(address)+1] = labelAddress & 0xFF;
    }
    return code;
}