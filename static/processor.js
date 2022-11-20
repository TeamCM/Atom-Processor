const COMMAND_NAME = ["HLT","NOP","LDA","LDX","LDY","STA","STX","STY","ADA","ADX","ADY","SUA","SUX","SUY","NANA","NANX","NANY","PUSHA","PUSHX","PUSHY","POPA","POPX","POPY","CMA","CMX","CMY","JMP","JZ","JC","JNZ","JNC","CALL","RET","INT","RETI","CZF","CCF","CIF","SZF","SCF","SIF"];
const FLAGS = {
    CF: 0b1,
    ZF: 0b10,
    IF: 0b100
};
Object.freeze(FLAGS);
// ret works on int
const COMMANDS = {
    HLT(cpu){cpu.halted = true;},
    NOP(){},
    LDA(cpu){
        const target = 0;
        const part1 = cpu.bus.read(cpu.ip); // 1 cycle
        cpu.ip++; // 1 cycle
        const part2 = cpu.bus.read(cpu.ip); // 1 cycle
        cpu.ip++; // 1 cycle
        const realPart1 = part1 << 8; // 1 cycle
        const addr =  realPart1 | part2; // 1 cycle
        cpu.registers[target] = cpu.bus.read(addr); // 2 cycles
    },
    LDX(cpu){
        const target = 1;
        const part1 = cpu.bus.read(cpu.ip); // 1 cycle
        cpu.ip++; // 1 cycle
        const part2 = cpu.bus.read(cpu.ip); // 1 cycle
        cpu.ip++; // 1 cycle
        const realPart1 = part1 << 8; // 1 cycle
        const addr =  realPart1 | part2; // 1 cycle
        cpu.registers[target] = cpu.bus.read(addr); // 2 cycles
    },
    LDY(cpu){
        const target = 2;
        const part1 = cpu.bus.read(cpu.ip); // 1 cycle
        cpu.ip++; // 1 cycle
        const part2 = cpu.bus.read(cpu.ip); // 1 cycle
        cpu.ip++; // 1 cycle
        const realPart1 = part1 << 8; // 1 cycle
        const addr =  realPart1 | part2; // 1 cycle
        cpu.registers[target] = cpu.bus.read(addr); // 2 cycles
    },
    STA(cpu){
        const target = 0;
        const part1 = cpu.bus.read(cpu.ip); // 1 cycle
        cpu.ip++; // 1 cycle
        const part2 = cpu.bus.read(cpu.ip); // 1 cycle
        cpu.ip++; // 1 cycle
        const realPart1 = part1 << 8; // 1 cycle
        const addr =  realPart1 | part2; // 1 cycle
        cpu.bus.write(addr, cpu.registers[target]); // 2 cycles
    },
    STX(cpu){
        const target = 1;
        const part1 = cpu.bus.read(cpu.ip); // 1 cycle
        cpu.ip++; // 1 cycle
        const part2 = cpu.bus.read(cpu.ip); // 1 cycle
        cpu.ip++; // 1 cycle
        const realPart1 = part1 << 8; // 1 cycle
        const addr =  realPart1 | part2; // 1 cycle
        cpu.bus.write(addr, cpu.registers[target]); // 2 cycles
    },
    STY(cpu){
        const target = 2;
        const part1 = cpu.bus.read(cpu.ip); // 1 cycle
        cpu.ip++; // 1 cycle
        const part2 = cpu.bus.read(cpu.ip); // 1 cycle
        cpu.ip++; // 1 cycle
        const realPart1 = part1 << 8; // 1 cycle
        const addr =  realPart1 | part2; // 1 cycle
        cpu.bus.write(addr, cpu.registers[target]); // 2 cycles
    },
    ADA(cpu){
        const target = 0;
        const val = cpu.registers[0] + cpu.registers[target] + cpu.getFlag(FLAGS.CF); // 5 cycles
        cpu.setFlag(FLAGS.CF, cpu.getFlag(FLAGS.CF) || val > 255);
        cpu.setFlag(FLAGS.ZF, cpu.getFlag(FLAGS.ZF) || ((val % 256) === 0));
        cpu.registers[0] = val; // 1 cycle
    },
    ADX(cpu){
        const target = 1;
        const val = cpu.registers[0] + cpu.registers[target] + cpu.getFlag(FLAGS.CF); // 5 cycles
        cpu.setFlag(FLAGS.CF, cpu.getFlag(FLAGS.CF) || val > 255);
        cpu.setFlag(FLAGS.ZF, cpu.getFlag(FLAGS.ZF) || ((val % 256) === 0));
        cpu.registers[0] = val; // 1 cycle
    },
    ADY(cpu){
        const target = 2;
        const val = cpu.registers[0] + cpu.registers[target] + cpu.getFlag(FLAGS.CF); // 5 cycles
        cpu.setFlag(FLAGS.CF, cpu.getFlag(FLAGS.CF) || val > 255);
        cpu.setFlag(FLAGS.ZF, cpu.getFlag(FLAGS.ZF) || ((val % 256) === 0));
        cpu.registers[0] = val; // 1 cycle
    },
    SUA(cpu){
        const target = 0;
        const val = cpu.registers[0] + (cpu.registers[target] ^ 255) + !cpu.getFlag(FLAGS.CF) // 6 cycles
        cpu.setFlag(FLAGS.CF, cpu.getFlag(FLAGS.CF) || val > 255);
        cpu.setFlag(FLAGS.ZF, cpu.getFlag(FLAGS.ZF) || ((val % 256) === 0));
        cpu.registers[0] = val; // 1 cycle
    },
    SUX(cpu){
        const target = 1;
        const val = cpu.registers[0] + (cpu.registers[target] ^ 255) + !cpu.getFlag(FLAGS.CF) // 6 cycles
        cpu.setFlag(FLAGS.CF, cpu.getFlag(FLAGS.CF) || val > 255);
        cpu.setFlag(FLAGS.ZF, cpu.getFlag(FLAGS.ZF) || ((val % 256) === 0));
        cpu.registers[0] = val; // 1 cycle
    },
    SUY(cpu){
        const target = 2;
        const val = cpu.registers[0] + (cpu.registers[target] ^ 255) + !cpu.getFlag(FLAGS.CF) // 6 cycles
        cpu.setFlag(FLAGS.CF, cpu.getFlag(FLAGS.CF) || val > 255);
        cpu.setFlag(FLAGS.ZF, cpu.getFlag(FLAGS.ZF) || ((val % 256) === 0));
        cpu.registers[0] = val; // 1 cycle
    },
    NANA(cpu){
        const target = 0;
        const val = (cpu.registers[0] & cpu.registers[target])^255; // 4 cycles
        cpu.setFlag(FLAGS.ZF, cpu.getFlag(FLAGS.ZF) || ((val % 256) === 0));
        cpu.registers[0] = val; // 1 cycle
    },
    NANX(cpu){
        const target = 1;
        const val = (cpu.registers[0] & cpu.registers[target])^255; // 4 cycles
        cpu.setFlag(FLAGS.ZF, cpu.getFlag(FLAGS.ZF) || ((val % 256) === 0));
        cpu.registers[0] = val; // 1 cycle
    },
    NANY(cpu){
        const target = 2;
        const val = (cpu.registers[0] & cpu.registers[target])^255; // 4 cycles
        cpu.setFlag(FLAGS.ZF, cpu.getFlag(FLAGS.ZF) || ((val % 256) === 0));
        cpu.registers[0] = val; // 1 cycle
    },
    PUSHA(cpu){
        const target = 0;
        cpu.bus.write(cpu.registers[3], cpu.registers[target]); // 3 cycles
        cpu.registers[3]--; // 1 cycle
    },
    PUSHX(cpu){
        const target = 1;
        cpu.bus.write(cpu.registers[3], cpu.registers[target]); // 3 cycles
        cpu.registers[3]--; // 1 cycle
    },
    PUSHY(cpu){
        const target = 2;
        cpu.bus.write(cpu.registers[3], cpu.registers[target]); // 3 cycles
        cpu.registers[3]--; // 1 cycle
    },
    POPA(cpu){
        const target = 0;
        cpu.registers[3]++; // 1 cycle
        cpu.registers[target] = cpu.bus.read(cpu.registers[3]); // 3 cycle
    },
    POPX(cpu){
        const target = 1;
        cpu.registers[3]++; // 1 cycle
        cpu.registers[target] = cpu.bus.read(cpu.registers[3]); // 3 cycle
    },
    POPY(cpu){
        const target = 2;
        cpu.registers[3]++; // 1 cycle
        cpu.registers[target] = cpu.bus.read(cpu.registers[3]); // 3 cycle
    },
    CMA(cpu){
        const target = 0;
        const val = cpu.registers[0] + (cpu.registers[target] ^ 255) + !cpu.getFlag(FLAGS.CF) // 6 cycles
        cpu.setFlag(FLAGS.CF, cpu.getFlag(FLAGS.CF) || val > 255);
        cpu.setFlag(FLAGS.ZF, cpu.getFlag(FLAGS.ZF) || ((val % 256) === 0));
    },
    CMX(cpu){
        const target = 1;
        const val = cpu.registers[0] + (cpu.registers[target] ^ 255) + !cpu.getFlag(FLAGS.CF) // 6 cycles
        cpu.setFlag(FLAGS.CF, cpu.getFlag(FLAGS.CF) || val > 255);
        cpu.setFlag(FLAGS.ZF, cpu.getFlag(FLAGS.ZF) || ((val % 256) === 0));
    },
    CMY(cpu){
        const target = 2;
        const val = cpu.registers[0] + (cpu.registers[target] ^ 255) + !cpu.getFlag(FLAGS.CF) // 6 cycles
        cpu.setFlag(FLAGS.CF, cpu.getFlag(FLAGS.CF) || val > 255);
        cpu.setFlag(FLAGS.ZF, cpu.getFlag(FLAGS.ZF) || ((val % 256) === 0));
    },
    JMP(cpu){
        const part1 = cpu.bus.read(cpu.ip); // 1 cycle
        cpu.ip++; // 1 cycle
        const part2 = cpu.bus.read(cpu.ip); // 1 cycle
        cpu.ip++; // 1 cycle
        const realPart1 = part1 << 8; // 1 cycle
        const newIp =  realPart1 | part2; // 1 cycle
        cpu.ip = newIp; // 1 cycle
    },
    JZ(cpu){
        const part1 = cpu.bus.read(cpu.ip); // 1 cycle
        cpu.ip++; // 1 cycle
        const part2 = cpu.bus.read(cpu.ip); // 1 cycle
        cpu.ip++; // 1 cycle
        const realPart1 = part1 << 8; // 1 cycle
        const newIp =  realPart1 | part2; // 1 cycle
        if(cpu.getFlag(FLAGS.ZF)) cpu.ip = newIp; // 1 cycle
    },
    JC(cpu){
        const part1 = cpu.bus.read(cpu.ip); // 1 cycle
        cpu.ip++; // 1 cycle
        const part2 = cpu.bus.read(cpu.ip); // 1 cycle
        cpu.ip++; // 1 cycle
        const realPart1 = part1 << 8; // 1 cycle
        const newIp =  realPart1 | part2; // 1 cycle
        if(cpu.getFlag(FLAGS.CF)) cpu.ip = newIp; // 1 cycle
    },
    JNZ(cpu){
        const part1 = cpu.bus.read(cpu.ip); // 1 cycle
        cpu.ip++; // 1 cycle
        const part2 = cpu.bus.read(cpu.ip); // 1 cycle
        cpu.ip++; // 1 cycle
        const realPart1 = part1 << 8; // 1 cycle
        const newIp =  realPart1 | part2; // 1 cycle
        if(!cpu.getFlag(FLAGS.ZF)) cpu.ip = newIp; // 1 cycle
    },
    JNC(cpu){
        const part1 = cpu.bus.read(cpu.ip); // 1 cycle
        cpu.ip++; // 1 cycle
        const part2 = cpu.bus.read(cpu.ip); // 1 cycle
        cpu.ip++; // 1 cycle
        const realPart1 = part1 << 8; // 1 cycle
        const newIp =  realPart1 | part2; // 1 cycle
        if(!cpu.getFlag(FLAGS.CF)) cpu.ip = newIp; // 1 cycle
    },
    CALL(cpu){
        const part1 = cpu.bus.read(cpu.ip); // 1 cycle
        cpu.ip++; // 1 cycle
        const part2 = cpu.bus.read(cpu.ip); // 1 cycle
        cpu.ip++; // 1 cycle

        const ip_part1 = cpu.ip >> 8; // 2 cycles
        const ip_part2 = cpu.ip & 0xFF; // 2 cycles
        cpu.bus.write(cpu.registers[3], ip_part1); // 3 cycles
        cpu.registers[3]--; // 1 cycle
        cpu.bus.write(cpu.registers[3], ip_part2); // 3 cycles
        cpu.registers[3]--; // 1 cycle
        
        const realPart1 = part1 << 8; // 1 cycle
        const newIp =  realPart1 | part2; // 1 cycle
        cpu.ip = newIp; // 1 cycle
    },
    RET(cpu){
        cpu.registers[3]++; // 1 cycle
        const part2 = cpu.bus.read(cpu.registers[3]); // 3 cycle
        cpu.registers[3]++; // 1 cycle
        const part1 = cpu.bus.read(cpu.registers[3]); // 3 cycle
        const realPart1 = part1 << 8; // 1 cycle
        const newIp =  realPart1 | part2; // 1 cycle
        cpu.ip = newIp; // 1 cycle
    },
    INT(cpu){
        const num = cpu.bus.read(cpu.ip); // 1 cycle
        cpu.ip++; // 1 cycle
        const arg = cpu.bus.read(cpu.ip); // 1 cycle
        cpu.ip++; // 1 cycle

        cpu.interrupt_request(num,arg);
    },
    RETI(){
        cpu.registers[3]++; // 1 cycle
        const part2 = cpu.bus.read(cpu.registers[3]); // 3 cycle
        cpu.registers[3]++; // 1 cycle
        const part1 = cpu.bus.read(cpu.registers[3]); // 3 cycle
        const realPart1 = part1 << 8; // 1 cycle
        const newIp =  realPart1 | part2; // 1 cycle

        cpu.registers[3]++; // 1 cycle
        const reg2 = cpu.bus.read(cpu.registers[3]); // 1 cycle

        cpu.registers[2] = reg2; // 1 cycle

        cpu.ip = newIp; // 1 cycle
    },
    CZF(cpu){
        cpu.setFlag(FLAGS.ZF, false);
    },
    CCF(cpu){
        cpu.setFlag(FLAGS.CF, false);
    },
    CIF(){
        cpu.setFlag(FLAGS.IF, false);
    },
    SZF(cpu){
        cpu.setFlag(FLAGS.ZF, true);
    },
    SCF(cpu){
        cpu.setFlag(FLAGS.CF, true);
    },
    SIF(){
        cpu.setFlag(FLAGS.IF, true);
    }
};
class Processor extends EventTarget{
    interrupt_start_address = 0

    // maskable
    maskable_interrupt_address = 0
    // non-maskable
    non_maskable_inerrupt_address = 0

    registers = new Uint8Array(5);
    sregisters = {
        cf: false,
        zf: false
    };
    /**
     * The bus which data will be readed/writed
     * @type {Bus}
     */
    bus
    /**
     * Instruction Pointer (aka program counter)
     * @type {number}
     */
    ip = 0
    /**
     * Default instruction pointer will be used on `reset()`
     * @type {number}
     */
    defaultIp = 0
    /**
     * Specifies if this Processor is halted or not
     * @type {boolean}
     */
    halted = false
    /**
     * Resets the cpu
     */
    reset(){
        this.halted = false;
        this.setFlag(FLAGS.CF, false);
        this.setFlag(FLAGS.ZF, false);
        this.setFlag(FLAGS.IF, true);
        this.registers[0] = this.registers[1] = this.registers[2] = 0;
        this.registers[3] = 255;
        this.ip = this.defaultIp;
        const event = new Event("update");
        this.dispatchEvent(event);
    }

    /**
     * @param {number} f
     * @returns {number}
     */
    getFlag(f){
        return this.registers[4] & f;
    }
    /**
     * @param {number} f
     * @param {boolean | number} v
     */
    setFlag(f,v){
        if(v)
            this.registers[4] |= f;
        else
            this.registers[4] &= ~f;
    }

    interrupt_request(interruptType,argument){
        if(cpu.getFlag(FLAGS.IF)){
            cpu.bus.write(this.registers[3], this.registers[2]); // 3 cycles
            this.registers[3]--; // 1 cycle

            const ip_part1 = this.ip >> 8; // 2 cycles
            const ip_part2 = this.ip & 0xFF; // 2 cycles
            this.bus.write(this.registers[3], ip_part1); // 3 cycles
            this.registers[3]--; // 1 cycle
            this.bus.write(this.registers[3], ip_part2); // 3 cycles
            this.registers[3]--; // 1 cycle

            this.registers[0] = interruptType; // 1 cycle
            this.registers[1] = argument; // 1 cycle

            this.ip = this.maskable_interrupt_address; // 1 cycle
            const event = new CustomEvent("interrupted");
            this.dispatchEvent(event);
        }
    }
    non_maskable_interrupt(interruptType,argument){
        cpu.bus.write(this.registers[3], this.registers[2]); // 3 cycles
        this.registers[3]--; // 1 cycle

        const ip_part1 = this.ip >> 8; // 2 cycles
        const ip_part2 = this.ip & 0xFF; // 2 cycles
        this.bus.write(this.registers[3], ip_part1); // 3 cycles
        this.registers[3]--; // 1 cycle
        this.bus.write(this.registers[3], ip_part2); // 3 cycles
        this.registers[3]--; // 1 cycle

        this.registers[0] = interruptType; // 1 cycle
        this.registers[1] = argument; // 1 cycle

        this.ip = this.non_maskable_inerrupt_address; // 1 cycle
        const event = new CustomEvent("interrupted");
        this.dispatchEvent(event);
    }

    /**
     * Fetch and execute a instruction
     * @param {bool} noupdate Should emit `update` event
     * @returns {bool}
     */
    step(noupdate){
        if(this.halted) return false;
        let command = this.bus.read(this.ip);
        this.ip++;
        /**
         * @type {Function?}
         */
        const commandFunction = COMMANDS[COMMAND_NAME[command]];
        commandFunction?.(this);
        if(!commandFunction){
            this.interrupt(0,command);
            return false;
        }
        const event = new Event("update");
        if(!noupdate) this.dispatchEvent(event);
        if(this.halted){
            const halted = new Event("halted");
            this.dispatchEvent(halted);
        }
        return true;
    }
}

if(!this.window)
    module.exports = {COMMAND_NAME,COMMANDS,FLAGS,Processor};