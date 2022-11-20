const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
function toHex(hex){
    return hex.toString(16).padStart(2,"0");
}
function toXY(i,w){
    return {x:i%w,y:Math.floor(i/w)}
}
class WriteGraphics extends Memory{
    constructor(){
        super(6);
    }
    #update(reset){
        if(reset){
            ctx.fillStyle = "#000";
            return ctx.fillRect(0,0,canvas.width,canvas.height);
        }
        if(this[5]){
            this[5] = 0;
            const color = [this[0],this[1],this[2]];
            const position = [this[3],this[4]];
            ctx.fillStyle = "#" + toHex(color[0]) + toHex(color[1]) + toHex(color[2]);
            ctx.fillRect(position[0],position[1],1,1);
        }
    }
    writeByte(address,value){
        if(address < 0 || address > (255*255)) throw new RangeError("address < 0 || address > (2**16)");
        this[address] = value;
        this.#update();
    }
    reset(){
        this.fill(0);
        this.#update(true);
    }
}
class GraphicsCard extends Memory{
    constructor(){
        super(canvas.width*canvas.height);
        this.#update();
    }
    #update(){
        for(let i=0;i<this.length;i++){
            const val = this[i];
            ctx.imageSmoothingEnabled = false;
            ctx.fillStyle = "#" + toHex(val) + toHex(val) + toHex(val);
            const {x,y} = toXY(i,canvas.width);
            ctx.fillRect(x,y,1,1);
        }
    }
    writeByte(address,value){
        if(address < 0 || address > (255*255)) throw new RangeError("address < 0 || address > (2**16)");
        this[address] = value;
        this.#update();
    }
    reset(){
        this.fill(0);
        this.#update();
    }
}