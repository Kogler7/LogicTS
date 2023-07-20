import LogicCore from './core';

export default class LogicLayer {
    private core?: LogicCore

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