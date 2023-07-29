import LogicLayer from "./layers/layer"
import XPSChecker from "./utils/xps"
import EventHandler from "./handlers/event"
import CursorHandler from "./handlers/cursor"
import ScopedEventNotifier from "./notifiers/scoped"
import StackedEventNotifier from "./notifiers/stacked"
import { Rect } from "./common/types2D"

export default class LogicCore {
    private _cache: HTMLCanvasElement
    private _cacheCtx: CanvasRenderingContext2D
    private _stage: HTMLCanvasElement
    private _stageCtx: CanvasRenderingContext2D

    private _stageWidth: number = 100
    private _stageHeight: number = 100

    private _layers: LogicLayer[] = []

    private _renderRequested = false
    private _dirty = true

    private _xps = new XPSChecker()
    private _fps: string = ''

    private _scopedNotifier = new ScopedEventNotifier()
    private _stackedNotifier = new StackedEventNotifier()
    private _eventHandler = new EventHandler(this)
    private _cursorHandler = new CursorHandler()

    constructor(stage?: HTMLCanvasElement) {
        this._cache = document.createElement('canvas')
        const cacheCtx = this._cache.getContext('2d')
        if (!cacheCtx) {
            throw new Error('cache context is null')
        }
        this._cacheCtx = cacheCtx
        this._stage = this._cache
        this._stageCtx = this._cacheCtx
        if (stage) {
            this.connect(stage)
        }
    }

    private _render() {
        this._xps.start()
        const { _stageWidth: width, _stageHeight: height } = this
        if (this._dirty) {
            this._cacheCtx.clearRect(0, 0, width, height)
            this._xps.check('clear')
            this._layers.forEach(layer => {
                const rendered = layer.onReloc(this._cacheCtx)
                if (rendered) {
                    this._xps.check(layer.name)
                }
            })
        }
        if (this._stage !== this._cache) {
            this._stageCtx.clearRect(0, 0, width, height)
            this._stageCtx.drawImage(this._cache, 0, 0)
            this._xps.check('draw')
        }
        this._layers.forEach(layer => {
            const rendered = layer.onPaint(this._stageCtx)
            if (rendered) {
                this._xps.check(layer.name)
            }
        })
        this._xps.check('FPS', '')
        this._fps = this._xps.get('FPS')
    }

    public render() {
        if (this._renderRequested) {
            return
        }
        this._renderRequested = true
        window.requestAnimationFrame(() => {
            this._render()
            this._renderRequested = false
        })
    }

    public rerender() {
        this._dirty = true
        this.render()
    }

    public markDirty() {
        this._dirty = true
    }

    public on(event: string, scoped: boolean, callback: Function, level: number = 0) {
        if (scoped) {
            this._scopedNotifier.on(event, callback)
        } else {
            this._stackedNotifier.on(event, callback, level)
        }
    }

    public off(event: string, scoped: boolean, callback: Function) {
        if (scoped) {
            this._scopedNotifier.off(event, callback)
        } else {
            this._stackedNotifier.off(event, callback)
        }
    }

    // fire event to scoped listeners via scoped notifier
    public fire(event: string, ...args: any[]): boolean {
        return this._scopedNotifier.fire(event, ...args)
    }

    // emit event to stacked layers via stacked notifier
    public emit(event: string, ...args: any[]): boolean {
        return this._stackedNotifier.emit(event, ...args)
    }

    public setCursor(cursor: string) {
        this._cursorHandler.set(cursor)
    }

    public popCursor(cursor: string) {
        this._cursorHandler.pop(cursor)
    }

    public mount(layer: LogicLayer) {
        layer._onMount(this)
        this._layers.push(layer)
    }

    public unmount() {
        console.log('unmount')
    }

    public connect(stage: HTMLCanvasElement) {
        this._eventHandler.bind(stage)
        this._cursorHandler.bind(stage)
        this._stage = stage
        const stageCtx = stage.getContext('2d')
        if (!stageCtx) {
            throw new Error('stage context is null')
        }
        this._stageCtx = stageCtx
        const { width, height } = stage
        this._stageWidth = width
        this._stageHeight = height
        this._cache.width = width
        this._cache.height = height
        this._cacheCtx.clearRect(0, 0, width, height)
        this._dirty = true
        this.render()
    }

    public disconnect() {
        this._eventHandler.unbind()
        this._stage = this._cache
        this._stageCtx = this._cacheCtx
        this._stageWidth = this._cache.width
        this._stageHeight = this._cache.height
        this._dirty = true
        this.render()
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

    public get fps(): string {
        return this._fps
    }

    public get focusRect(): Rect | null {
        return this._eventHandler.focusRect
    }
}