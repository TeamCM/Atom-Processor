// arg data for ops
// type 0, int
// type 1, address (2-byte int) (if parseInt does not work, it will be classified as label)
// type 2, register
const COMMAND_ALIASES = {
    PUSH(...arguments){
        return `PUSH${arguments[0].toUpperCase()}`;
    },
    POP(...arguments){
        return `POP${arguments[0].toUpperCase()}`;
    },
    ADD(...arguments){
        return `AD${arguments[0].toUpperCase()}`;
    },
    SUB(...arguments){
        return `SU${arguments[0].toUpperCase()}`;
    },
    LDR(...arguments){
        return `LD${arguments[0].toUpperCase()}`;
    },
    STR(...arguments){
        return `ST${arguments[0].toUpperCase()}`;
    },
    NAND(...arguments){
        return `NAN${arguments[0].toUpperCase()}`;
    },
    CMP(...arguments){
        return `CM${arguments[0].toUpperCase()}`;
    }
};
COMMAND_ALIASES.LD = COMMAND_ALIASES.LDR;
COMMAND_ALIASES.ST = COMMAND_ALIASES.STR;
const CA_MODELS = {
    PUSH: [2],
    POP: [2],
    ADD: [2],
    SUB: [2],
    LDR: [2],
    STR: [2],
    NAND: [2],
    CMP: [2]
};
CA_MODELS.LD = CA_MODELS.LDR;
CA_MODELS.ST = CA_MODELS.STR;
Object.freeze(COMMAND_ALIASES);
Object.freeze(CA_MODELS);
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
    INT: [0],
    RETI: [],
    CCF: [],
    CZF: [],
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
        code.push(COMMAND_NAME.indexOf(op));
        
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