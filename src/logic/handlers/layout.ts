import { Point, Vector } from "../common/types2D"
import LogicCore from "../core"
import { Animation, BezierCurves } from "../utils/anime"

export default class LayoutHandler {
    private _core: LogicCore
    private _targetEl: HTMLElement | null = null

    private _cache: Map<HTMLElement, any> = new Map()

    public originBias: Point = new Point()
    public logicWidth: number = 25 // 25 pixels per logic unit by default
    public logicWidthMin: number = 1 // 1 pixel per logic unit at least
    public logicWidthMax: number = 100 // 100 pixels per logic unit at most

    public zoomSpeed: number = 0.5 // logic unit per wheel event (deltaY)
    public zoomLevel: number = 0 // current zoom level, 0 by default
    public levelMax: number = 2 // 2 levels at most
    public levelUpFactor: number = 4 // four times bigger each level
    public gridWidthMin: number = 10 // pixels per grid at least
    public gridWidthMax: number = this.gridWidthMin * this.levelUpFactor // pixels per grid at most
    public gridWidthFactor: number = this.levelUpFactor ** this.zoomLevel // 1, 4, 16...
    public gridWidth: number = this.logicWidth * this.gridWidthFactor // pixels per grid (logic unit)

    private _sliding = false
    private _slideVector: Vector = new Vector()

    constructor(core: LogicCore) {
        this._core = core
        core.on('pan.ing', true, () => {
            const { lastPos, focusPos } = this._core
            this._panTo(Vector.fromPoints(lastPos, focusPos))
        })
        core.on('zoom.ing', true, (e: WheelEvent) => {
            const { focusPos } = this._core
            this._zoomAt(e.deltaY, focusPos)
        })
        core.on('slide.ing', true, () => {
            const vec = Vector.fromPoints(
                this._core.focusPos,
                this._core.anchorPos
            ).divide(this.logicWidth * 30)
            this._slideVector = vec
        })
        core.on('slide.begin', true, () => {
            this._sliding = true
            this._slideVector = new Vector()
            this._trySlide()
        })
        core.on('slide.end', true, () => {
            this._sliding = false
            this._slideVector = new Vector()
        })
        // double click middle button to reset originBias
        core.on('doubleclick.middle', true, () => {
            const bias = this.originBias.copy()
            const anime = new Animation(
                (value: number) => {
                    this.originBias = bias.times(1 - value)
                    this._core.renderAll()
                },
                300,
                BezierCurves.easeInOut,
                () => { this._core.fire('reloc.begin') },
                () => { this._core.fire('reloc.end') }
            )
            anime.start()
        })
    }

    public bind(el: HTMLElement) {
        this._targetEl = el
        const cachedData = this._cache.get(el)
        if (cachedData) {
            this.originBias = cachedData.logicOrigin
            this.logicWidth = cachedData.logicLength
        }
    }

    public unbind() {
        if (this._targetEl) {
            this._cache.set(this._targetEl, {
                logicOrigin: this.originBias,
                logicLength: this.logicWidth
            })
        }
        this._targetEl = null
    }

    public crd2pos(crd: Point): Point {
        const { originBias: origin, logicWidth: length } = this
        return crd.plus(origin).times(length)
    }

    public pos2crd(pos: Point): Point {
        const { originBias: origin, logicWidth: length } = this
        return pos.divide(length).minus(origin)
    }

    private _panTo(delta: Vector) {
        this.originBias = this.originBias.shift(delta.divide(this.logicWidth))
    }

    private _zoomAt(angle: number, center: Point) {
        const { logicWidth: length, originBias: origin } = this
        const angle2zoomUnit = 1 / 293.33 // zoom unit per wheel event (deltaY)
        const factor = - this.zoomSpeed * angle2zoomUnit / this.gridWidthFactor
        const delta = angle * factor
        // prevent zoom out too much, in case of unexpected behavior
        if (delta < 0 && length + delta <= this.logicWidthMin) {
            console.warn('Zoom out too much, logicWidthMin reached.')
            return
        }
        // prevent zoom in too much, in case of unexpected behavior
        if (delta > 0 && length + delta >= this.logicWidthMax) {
            console.warn('Zoom in too much, logicWidthMax reached.')
            return
        }
        // update logicLength and logicOrigin
        const lastCtrCrd = this.pos2crd(center)
        this.logicWidth = length + delta
        const newCtrCrd = this.pos2crd(center)
        const crdBias = Vector.fromPoints(lastCtrCrd, newCtrCrd)
        this.originBias = origin.shift(crdBias)
        // update grid related properties
        if (this.gridWidth < this.gridWidthMin) {
            if (this.zoomLevel < this.levelMax) {
                this.zoomLevel++
            }
        }
        else if (this.gridWidth > this.gridWidthMax) {
            if (this.zoomLevel > 0) {
                this.zoomLevel--
            }
        }
        this.gridWidthFactor = this.levelUpFactor ** this.zoomLevel
        this.gridWidth = this.logicWidth * this.gridWidthFactor
    }

    private _trySlide() {
        if (!this._sliding) {
            return
        }
        this.originBias = this.originBias.shift(this._slideVector)
        this._core.renderAll() // force render
        requestAnimationFrame(this._trySlide.bind(this))
    }
}