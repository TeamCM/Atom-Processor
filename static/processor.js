const OPCODES = {
    HLT: 0,
    NOP: 1,
    LDR: 2,
    STR: 3,
    MOV: 4,
    ADD: 5,
    SUB: 6,
    LSH: 7,
    RSH: 8,
    NOT: 9,
    OR: 10,
    AND: 11,
    XOR: 12,
    PUSH: 13,
    POP: 14,
    JMP: 15,
    CALL: 16,
    RET: 17,
    CMP: 18,
    JZ: 19,
    JNZ: 20,
    JC: 21,
    JNC: 22,
    JN: 23,
    JNN: 24,
    JV: 25,
    JNV: 26,
    INC: 27,
    DEC: 28,
    MOVV: 29,
    JMPR: 30,
    CCF: 31,
    CZF: 32,
    CNF: 34,
    CVF: 35
};
const REGISTERS = {
    AX: 0,
    BX: 1,
    CX: 2,
    DX: 3,
    SP: 4
};
const registers = new Uint8Array(Object.keys(REGISTERS).length);

const sregisters = {
    zf: false,
    cf: false,
    nf: false,
    vf: false
};
const char = code => String.fromCharCode(code);
const OPCYCLES = {
    HLT: 1,
    LDR: 10,
    STR: 9,
    MOV: 6,
    ADD: 19,
    SUB: 22,
    LSH: 6,
    RSH: 6,
    NOT: 5,
    OR: 7,
    AND: 7,
    XOR: 7,
    PUSH: 8,
    POP: 7,
    JMP: 7,
    CALL: 19,
    RET: 13,
    CMP: 19,
    JZ: 7,
    JNZ: 7,
    JC: 7,
    JNC: 7,
    JN: 7,
    JNN: 7,
    JV: 7,
    JNV: 7,
    INC: 7,
    DEC: 6,
    MOVV: 5,
    JMPR: 4,
    CCF: 1,
    CZF: 1,
    CNF: 1,
    CVF: 1
}
const commands = {
    HLT(cpu){cpu.halted = true;;},
    NOP(){},
    LDR(cpu,bus){
        let reg_byte = bus.read(cpu.ip);
        cpu.ip++;
        let mbyte = bus.read(cpu.ip);
        cpu.ip++;
        let lbyte = bus.read(cpu.ip);
        cpu.ip++;
        let register_ldr = cpu.getRegister(reg_byte);
        registers[register_ldr] = bus.read((mbyte << 8) | lbyte);
        cpu.cycles-=4;
    },
    STR(cpu,bus){
        let reg_byte = bus.read(cpu.ip);
        cpu.ip++;
        let mbyte = bus.read(cpu.ip);
        cpu.ip++;
        let lbyte = bus.read(cpu.ip);
        cpu.ip++;
        let register_save = cpu.getRegister(reg_byte);
        bus.write((mbyte << 8) | lbyte, register_save);
    },
    MOV(cpu,bus){
        let reg_byte = bus.read(cpu.ip);
        cpu.ip++;
        let reg_byte2 = bus.read(cpu.ip);
        cpu.ip++;
        let register1 = cpu.getRegister(reg_byte);
        let register2 = cpu.getRegister(reg_byte2);
        registers[register2] = registers[register1];
    },
    ADD(cpu,bus){
        let reg_byte = bus.read(cpu.ip);
        cpu.ip++;
        let register_add = cpu.getRegister(reg_byte);
        let result = registers[0] + registers[register_add] + sregisters.cf;
        if(result > 255) sregisters.cf = true;
        if(result == 0) sregisters.zf = true;
        if(result & 0x80) sregisters.nf = true;
        if((registers[0] ^ result)&(~(registers[0] ^ registers[register_add]))) sregisters.vf = true;
        registers[0] = result;
    },
    SUB(cpu,bus){
        let reg_byte = bus.read(cpu.ip);
        cpu.ip++;
        let register_sub = cpu.getRegister(reg_byte);
        let value  = registers[register_sub] ^ 0x00FF;
        let result = registers[0] + value + !sregisters.cf;
        cpu.cycles-=4;
        if(result > 255) sregisters.cf = true;
        if(result == 0) sregisters.zf = true;
        if(result & 0x80) sregisters.nf = true;
        if((registers[0] ^ result)&(~(registers[0] ^ registers[register_sub]))) sregisters.vf = true;
        cpu.cycles-=7;
        registers[0] = result;
    },
    LSH(cpu,bus){
        let int = bus.read(cpu.ip);
        cpu.ip++;
        registers[0] <<= int;
        if(registers[0] == 0) sregisters.zf = true;
    },
    RSH(cpu, bus){
        let int = bus.read(cpu.ip);
        cpu.ip++;
        registers[0] >>= int;
        if(registers[0] == 0) sregisters.zf = true;
    },
    NOT(){
        registers[0] = ~registers[0];
        if(registers[0] == 0) sregisters.zf = true;
    },
    OR(cpu,bus){
        let reg_byte = bus.read(cpu.ip);
        cpu.ip++;
        let register_or = cpu.getRegister(reg_byte);
        registers[0] = registers[0] | registers[register_or];
        if(registers[0] == 0) sregisters.zf = true;
    },
    AND(cpu,bus){
        let reg_byte = bus.read(cpu.ip);
        cpu.ip++;
        let register_and = cpu.getRegister(reg_byte);
        registers[0] = registers[0] & registers[register_and];
        if(registers[0] == 0) sregisters.zf = true;
    },
    XOR(cpu,bus){
        let reg_byte = bus.read(cpu.ip);
        cpu.ip++;
        let register_xor = cpu.getRegister(reg_byte);
        registers[0] = registers[0] ^ registers[register_xor];
        if(registers[0] == 0) sregisters.zf = true;
    },
    PUSH(cpu,bus){
        let reg_byte = bus.read(cpu.ip);
        cpu.ip++;
        bus.write(registers[4], registers[cpu.getRegister(reg_byte)]);
        registers[4]--;
    },
    POP(cpu,bus){
        let reg_byte = bus.read(cpu.ip);
        cpu.ip++;
        registers[4]++;
        let val = bus.read(registers[4]);
        registers[cpu.getRegister(reg_byte)] = val;
    },
    JMP(cpu,bus){
        let mbyte = bus.read(cpu.ip);
        cpu.ip++;
        let lbyte = bus.read(cpu.ip);
        cpu.ip++;
        let addr_to = (mbyte << 8) | lbyte;
        cpu.ip = addr_to;
    },
    CALL(cpu,bus){
        let mbyte = bus.read(cpu.ip);
        cpu.ip++;
        let lbyte = bus.read(cpu.ip);
        cpu.ip++;
        let addr_to2 = (mbyte << 8) | lbyte;
        bus.write(registers[4], (cpu.ip & 0xFF00) >> 8);
        registers[4]--;
        bus.write(registers[4], cpu.ip & 0xFF);
        registers[4]--;
        cpu.ip = addr_to2;
    },
    RET(cpu,bus){
        registers[4]++;
        let addr_val = bus.read(registers[4]);
        registers[4]++;
        let sec = bus.read(registers[4]);
        cpu.ip = (sec << 8) | addr_val;
    },
    CMP(cpu,bus){
        let reg_sub_byte = bus.read(cpu.ip);
        cpu.ip++;
        let register_sub = cpu.getRegister(reg_sub_byte);
        let value  = registers[register_sub] ^ 0x00FF;
        let result = registers[0] + value + !sregisters.cf;
        cpu.cycles-=4;
        if(result > 255) sregisters.cf = true;
        if((result & 0xFF) == 0) sregisters.zf = true;
        if(result & 0x80) sregisters.nf = true;
        if((registers[0] ^ result)&(~(registers[0] ^ registers[register_sub]))) sregisters.vf = true;
        cpu.cycles-=7;
    },
    JZ(cpu,bus){
        let mbyte = bus.read(cpu.ip);
        cpu.ip++;
        let lbyte = bus.read(cpu.ip);
        cpu.ip++;
        let jzip = (mbyte << 8) | lbyte;
        if(sregisters.zf){cpu.ip = jzip;}
        return 1;
    },
    JNZ(cpu,bus){
        let mbyte = bus.read(cpu.ip);
        cpu.ip++;
        let lbyte = bus.read(cpu.ip);
        cpu.ip++;
        let jnzip = (mbyte << 8) | lbyte;
        if(!sregisters.zf){cpu.ip = jnzip;}
        return 1;
    },
    JC(cpu,bus){
        let mbyte = bus.read(cpu.ip);
        cpu.ip++;
        let lbyte = bus.read(cpu.ip);
        cpu.ip++;
        let jcip = (mbyte << 8) | lbyte;
        if(sregisters.cf){cpu.ip = jcip;}
        return 1;
    },
    JNC(cpu,bus){
        let mbyte = bus.read(cpu.ip);
        cpu.ip++;
        let lbyte = bus.read(cpu.ip);
        cpu.ip++;
        let jncip = (mbyte << 8) | lbyte;
        if(!sregisters.cf){cpu.ip = jncip;}
    },
    JN(cpu,bus){
        let mbyte = bus.read(cpu.ip);
        cpu.ip++;
        let lbyte = bus.read(cpu.ip);
        cpu.ip++;
        let jncip = (mbyte << 8) | lbyte;
        if(sregisters.nf){cpu.ip = jncip;}
        return 1;
    },
    JNN(cpu,bus){
        let mbyte = bus.read(cpu.ip);
        cpu.ip++;
        let lbyte = bus.read(cpu.ip);
        cpu.ip++;
        let jncip = (mbyte << 8) | lbyte;
        if(!sregisters.nf){cpu.ip = jncip;}
    },
    JV(cpu,bus){
        let mbyte = bus.read(cpu.ip);
        cpu.ip++;
        let lbyte = bus.read(cpu.ip);
        cpu.ip++;
        let jncip = (mbyte << 8) | lbyte;
        if(sregisters.vf){cpu.ip = jncip;}
    },
    JNV(cpu,bus){
        let mbyte = bus.read(cpu.ip);
        cpu.ip++;
        let lbyte = bus.read(cpu.ip);
        cpu.ip++;
        let jncip = (mbyte << 8) | lbyte;
        if(!sregisters.vf){cpu.ip = jncip;}
        return 1;
    },
    INC(cpu,bus){
        let reg_inc = cpu.getRegister(bus.read(cpu.ip));
        cpu.ip++;
        registers[reg_inc]++;
        if(registers[reg_inc] == 0)sregisters.zf = true;
    },
    DEC(cpu,bus){
        let reg_inc = cpu.getRegister(bus.read(cpu.ip));
        cpu.ip++;
        let reg_dec = cpu.getRegister(reg_inc);
        registers[reg_dec]--;
        if(registers[reg_dec] == 0) sregisters.zf = true;
    },
    MOVV(cpu,bus){
        let rval = bus.read(cpu.ip);
        cpu.ip++
        let regval = bus.read(cpu.ip);
        cpu.ip++
        let reg = cpu.getRegister(regval);
        registers[reg] = rval;
    },
    JMPR(cpu,bus){
        let rval = registers[cpu.getRegister(cpu.readFromBus(bus, cpu.ip))];
        cpu.ip++; // necessary lol
        cpu.ip = (cpu.readFromBus(rval, bus) << 8) | cpu.readFromBus(rval+1, bus), registers[register_save];
    },
    CCF(){sregisters.cf = false;;},
    CZF(){sregisters.zf = false;;},
    CNF(){sregisters.nf = false;;},
    CVF(){sregisters.vf = false;;}
};

class CPU{
    halted = false
    getRegister(hex){
        return hex;
    }
    reset(bus){
        registers.fill(0);
        registers[4] = registers[5] = 0xFF;
        sregisters.vf = sregisters.nf = sregisters.zf = sregisters.cf = false;
        this.ip = 2048;
        bus.memory.fill(0);
        this.halted = false;
    }
    /**
     * @argument {Bus} bus
     */
    step(bus){
        const command = this.fetchByte(bus);
        //console.log(command, Object.entries(OPCODES).find(a => a[1] == command)[0]);
        const fcommand = commands[Object.entries(OPCODES).find(a => a[1] == command)[0]];
        if(fcommand) fcommand(this,bus);
        else{
            this.halted = true;
            alert(`No opcode for ${command}`);
        }
        this.programCounter++;
    }
    cycles = 0
    clock(bus){
        if(this.cycles == 0){
            const opcode = bus.read(this.ip);
            this.ip++;
            // getting function and cycles is not really a clock cycle
            const fcommand = commands[Object.entries(OPCODES).find(a => a[1] == opcode)[0]];
            const cycles = OPCYCLES[Object.entries(OPCODES).find(a => a[1] == opcode)[0]];

            console.log(opcode, cycles);
            this.cycles = cycles;
            this.cycles += (fcommand(this,bus) || 0);
        }
        this.cycles--;
    }
}