export function pixel():void{
    if (Game.cpu.bucket >= 10000)
    {
        if (!Memory.StopPixel)
            Game.cpu.generatePixel()
    }
}