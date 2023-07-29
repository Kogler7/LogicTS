import LogicCore from '../core';

export default class LogicLayer {
    protected core?: LogicCore
    public name: string

    constructor(name: string = 'unnamed') {
        this.name = name
    }

    public _onMount(core: LogicCore) {
        this.core = core
        this.onMount()
    }

    public onMount() { }

    public onReloc(ctx: CanvasRenderingContext2D): boolean {
        return false
    }

    public onPaint(ctx: CanvasRenderingContext2D): boolean {
        return false
    }
}