import LogicCore from '../core';

export default class LogicLayer {
    protected core?: LogicCore
    public name: string
    public level: number = 0
    public visible: boolean = true

    constructor(name: string, level: number = 0, visible: boolean = true) {
        this.name = name
        this.level = level
        this.visible = visible
    }

    public _onMount(core: LogicCore) {
        this.core = core
        this.onMount()
    }

    public onMount() { }

    public onUnmount() { }

    public onReloc(ctx: CanvasRenderingContext2D): boolean {
        return false
    }

    public onPaint(ctx: CanvasRenderingContext2D): boolean {
        return false
    }
}