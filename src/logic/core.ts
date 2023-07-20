import LogicLayer from "./layer"

export default class LogicCore {
    private cache: HTMLCanvasElement
    private cacheCtx: CanvasRenderingContext2D
    private stage: HTMLCanvasElement
    private stageCtx: CanvasRenderingContext2D

    private width: number = 100
    private height: number = 100

    private layers: LogicLayer[] = []

    private dirty = true

    constructor(stage?: HTMLCanvasElement) {
        this.cache = document.createElement('canvas')
        const cacheCtx = this.cache.getContext('2d')
        if (!cacheCtx) {
            throw new Error('cache context is null')
        }
        this.cacheCtx = cacheCtx
        this.stage = this.cache
        this.stageCtx = this.cacheCtx
        if (stage) {
            this.connect(stage)
        }
    }

    public render() {
        const { width, height } = this
        if (this.dirty) {
            this.cacheCtx.clearRect(0, 0, width, height)
            this.layers.forEach(layer => {
                layer.onReloc(this.cacheCtx)
            })
        }
        this.stageCtx.clearRect(0, 0, width, height)
        this.stageCtx.drawImage(this.cache, 0, 0)
        this.layers.forEach(layer => {
            layer.onPaint(this.stageCtx)
        })
    }

    public forceReloc() {
        this.dirty = true
        this.render()
    }

    public markDirty() {
        this.dirty = true
    }

    public mount(layer: LogicLayer) {
        this.layers.push(layer)
    }

    public unmount() {
        console.log('unmount')
    }

    public connect(stage: HTMLCanvasElement) {
        this.stage = stage
        const stageCtx = stage.getContext('2d')
        if (!stageCtx) {
            throw new Error('stage context is null')
        }
        this.stageCtx = stageCtx
        const { width, height } = stage
        this.width = width
        this.height = height
        this.cache.width = width
        this.cache.height = height
        this.cacheCtx.clearRect(0, 0, width, height)
        this.dirty = true
        this.render()
    }

    public disconnect() {
        console.log('disconnect')
    }

    public attach() {
        console.log('attach')
    }

    public detach() {
        console.log('detach')
    }

    public bind() {
        console.log('bind')
    }

    public unbind() {
        console.log('unbind')
    }

    public reset() {
        console.log('reset')
    }
}