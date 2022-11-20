// arg data for ops
// type 0, int
// type 1, address (2-byte int) (if parseInt does not work, it will be classified as label)
const REGISTERS = {
    "AX":"AC",
    "AC":"AC",
    "BX":"XR",
    "XR":"XR",
    "CX":"YR",
    "YR":"YR",
};
const COMMAND_ALIASES = {
    PUSH(...arguments){
        return `PUSH${REGISTERS[arguments[0].toUpperCase()][0]}`;
    },
    POP(...arguments){
        return `POP${REGISTERS[arguments[0].toUpperCase()][0]}`;
    },
    ADD(...arguments){
        return `AD${REGISTERS[arguments[0].toUpperCase()][0]}`;
    },
    SUB(...arguments){
        return `SU${REGISTERS[arguments[0].toUpperCase()][0]}`;
    },
    LDR(...arguments){
        return `LD${REGISTERS[arguments[0].toUpperCase()][0]} ${arguments[1]}`;
    },
    STR(...arguments){
        return `ST${REGISTERS[arguments[0].toUpperCase()][0]} ${arguments[1]}`;
    },
    NAND(...arguments){
        return `NAN${REGISTERS[arguments[0].toUpperCase()][0]}`;
    },
    CMP(...arguments){
        return `CM${REGISTERS[arguments[0].toUpperCase()][0]}`;
    }
};
COMMAND_ALIASES.LD = COMMAND_ALIASES.LDR;
COMMAND_ALIASES.ST = COMMAND_ALIASES.STR;
Object.freeze(COMMAND_ALIASES);
const OPMODELS = {
    HLT: [],
    NOP: [],
    LDA: [1],
    LDX: [1],
    LDY: [1],
    STA: [1],
    STX: [1],
    STY: [1],
    ADA: [],
    ADX: [],
    ADY: [],
    SUA: [],
    SUX: [],
    SUY: [],
    NANA: [],
    NANX: [],
    NANY: [],
    PUSHA: [],
    PUSHX: [],
    PUSHY: [],
    POPA: [],
    POPX: [],
    POPY: [],
    CMA: [],
    CMX: [],
    CMY: [],
    JMP: [1],
    JZ: [1],
    JC: [1],
    JNZ: [1],
    JNC: [1],
    CALL: [1],
    RET: [],
    INT: [0,0],
    RETI: [],
    CCF: [],
    CZF: [],
    CIF: [],
    SCF: [],
    SZF: [],
    SIF: []
};

const toCharCode = str => Array.of(...str).map(s => s.charCodeAt(0));
function asm2code(str,offset){
    const markedAddresses = {};
    const labelsAddresses = {};
    const lines = str.split("\n");
    const code = [];
    for(let i=0;i<lines.length;i++){
        const line = lines[i].replace(/;.{0,}/i, "").trimEnd(); // trimEnd removes blank space
        if(/.{0,}:/i.test(line)){
            labelsAddresses[line.substring(0,line.length-1)] = offset + code.length;
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
        let line2 = line;
        if(COMMAND_ALIASES[op])
            line2 = COMMAND_ALIASES[op](...argsSplitted);
        const splitted2 = line2.split(" ");
        const op2 = splitted2.shift().toUpperCase();
        const args2 = splitted2.join(" ");
        const argsSplitted2 = args2.split(",");
        
        const model = OPMODELS[op2];
        if(!model) throw new SyntaxError(`${op2} ${i+1}`);
        code.push(COMMAND_NAME.indexOf(op2));
        
        for(let j=0;j<model.length;j++){
            const type = model[j];
            if(!type)
                code.push(parseInt(argsSplitted2[j]) & 0xFF);
            else if(type == 1){
                if(parseInt(argsSplitted2[j]))
                    code.push((parseInt(argsSplitted2[j]) & 0xFF00) >> 8, parseInt(argsSplitted2[j]) & 0xFF);
                else{
                    markedAddresses[code.length] = [argsSplitted2[j], i];
                    code.push(0,0);
                }
            }
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

if(!this.window)
    module.exports = {asm2code, REGISTERS, COMMAND_ALIASES, OPMODELS}