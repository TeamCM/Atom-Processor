class Memory extends Uint8Array{
    constructor(size){
        //if(size >= (2**16)) throw new RangeError("16-bit addressing");
        super(size);
    }
    readByte(address){
        if(address < 0 || address > (255*255)) throw new RangeError("address < 0 || address > (2**16)");
        return this[address];
    }
    writeByte(address, value){
        if(address < 0 || address > (255*255)) throw new RangeError("address < 0 || address > (2**16)");
        this[address] = value;
    }
}
class ROM extends Memory{
    ip = 0
    constructor(size, startValue){
        super(size);
        startValue?.forEach?.((v, i) => this[i] = v);
    }
    writeByte(){throw Error("Writing is not allowed.")}
}

const Bus = class Bus{
    memory = new Memory(0x800);
    rom = new ROM(0xf7ff);
    /**
     * Read a address from bus
     * @param {number} address 
     * @returns {number}
     */
    read(address){
        if(address < 0x800){
            return this.memory.readByte(address);
        }else if(address >= 0x800){
            return this.rom.readByte(address - 0x800);
        }
    }
    /**
     * Write a address to bus
     * @param {number} address 
     * @param {number} value 
     */
    write(address,value){
        if(address < 0x800){
            this.memory.writeByte(address, value);
        }
    }
    /**
     * Load the rom with data
     * @param {number[]} data 
     */
    loadROM(data){
        this.rom = new ROM(0xf7ff, data);
    }
}
console.log("0x0000 - 0x0800: RAM");