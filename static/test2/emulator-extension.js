const ramCanvas = document.querySelector("canvas#ram-viewer2");
/**
 * @type {CanvasRenderingContext2D}
 */
const ramCtx = ramCanvas.getContext("2d");
function toHex(red,green,blue){
    return `#${red.toString(16)}${green.toString(16)}${blue.toString(16)}`;
}
const colorIP = "#00A";
registersColors[4] = "#EEE";
updateRegistersColors();
updateMemory = function(){
    let k = 0;
    for(let y=0;y<255;y++){
        for(let x=0;x<255;x++){
            const num = bus.read(k++);
            let hex = toHex(num, num, num);
            if(cpu.ip === k){
                hex = colorIP;
            }else if(cpu.registers[0] === k-1){
                hex = registersColors[0];
            }else if(cpu.registers[1] === k-1){
                hex = registersColors[1];
            }else if(cpu.registers[2] === k-1){
                hex = registersColors[2];
            }else if(cpu.registers[3] === k-1){
                hex = registersColors[3];
            }else if(cpu.registers[4] === k-1){
                hex = registersColors[4];
            }
            ramCtx.fillStyle = hex;
            ramCtx.fillRect(x,y,1,1);
        }
    }
}