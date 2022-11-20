class Memory extends Uint8Array{
    readByte(address){
        if(address < 0 || address > (255*255)) throw new RangeError("address < 0 || address > (2**16)");
        return this[address];
    }
    writeByte(address, value){
        if(address < 0 || address > (255*255)) throw new RangeError("address < 0 || address > (2**16)");
        this[address] = value;
    }
    reset(){this.fill(0);}
}
class PS_2{
    read(){

    }
    write(){
        
    }
}

class ROM extends Memory{
    ip = 0
    loadROM(val){
        for(let i=0;i<val.length;i++) this[i] = val[i];
    }
    writeByte(){}
    reset(){}
}

class TwoDMemory{
    /**
     * @type {Uint8Array[]}
     */
    memory = []
    constructor(sizex,sizey){
        for(let i=0;i<sizey;i++) this.memory.push(new Uint8Array(sizex));
    }
    /**
     * @param {number} x 
     * @param {number} y 
     * @returns {number}
     */
    read(x,y){
        return this.memory[y][x];
    }
    /**
     * @param {number} x 
     * @param {number} y 
     * @param {number} val
     */
    write(x,y,val){
        this.memory[y][x] = val;
    }
}

const Bus_ = class Bus{
    memory = new Memory(0x800);
    rom = new ROM(0xf7ff);
    romStart = 0x800
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

const Bus = class Bus{
    rangesClasses = {}
    ranges = {}
    /**
     * @param {number} addr 
     * @returns {Array<any, number>}
     */
    findClassByAddr(addr){
        const entries = Object.entries(this.ranges);
        let addrFromRet;
        let range;
        for(let i=0;i<entries.length;i++){
            const entry = entries[i];
            const [addrFrom,addrTo] = entry[1];
            if((addrFrom <= addr) && (addrTo > addr)){
                range = this.rangesClasses[entry[0]];
                addrFromRet = addrFrom;
                break;
            }
        }
        return [range,addrFromRet]
    }
    addComponent(id,addressFrom,addressTo,memoryClass){
        this.ranges[id] = [addressFrom,addressTo];
        this.rangesClasses[id] = memoryClass;
    }
    removeComponent(id){
        delete this.ranges[id];
        delete this.rangesClasses[id];
    }
    read(address){
        const [mem,addrFrom] = this.findClassByAddr(address);
        return mem.readByte(address-addrFrom);
    }
    write(address,value){
        const [mem,addrFrom] = this.findClassByAddr(address);
        mem.writeByte(address-addrFrom,value);
    }
    reset(){
        Object.keys(this.rangesClasses).forEach(r => {
            this.rangesClasses[r].reset?.();
        });
    }
}

if(!this.window)
    module.exports = {Bus,Memory,ROM,Bus_};