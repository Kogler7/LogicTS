import LogicCore from '../core';

export default class LogicLayer {
    private core?: LogicCore
    public name: string

    constructor(name: string = 'unnamed') {
        this.name = name
    }

    public onMount(core: LogicCore) {
        this.core = core
    }

    public onReloc(ctx: CanvasRenderingContext2D): boolean {
        return false
    }

    public onPaint(ctx: CanvasRenderingContext2D): boolean {
        return false
    }
}