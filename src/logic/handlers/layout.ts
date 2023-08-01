import { Point, Vector } from "../common/types2D"
import LogicCore from "../core"

export default class LayoutHandler {
    private _core: LogicCore
    private _targetEl: HTMLElement | null = null

    private _cache: Map<HTMLElement, any> = new Map()

    public originBias: Point = new Point()
    public logicWidth: number = 25
    public logicWidthMin: number = 1
    public logicWidthMax: number = 100

    public zoomStep: number = 0.1
    public zoomLevel: number = 0
    public levelMax: number = 2
    public levelUpFactor: number = 4
    public gridWidthMin: number = 10
    public gridWidthMax: number = this.gridWidthMin * this.levelUpFactor
    public gridWidthFactor: number = this.levelUpFactor ** this.zoomLevel
    public gridWidth: number = this.logicWidth * this.gridWidthFactor

    constructor(core: LogicCore) {
        this._core = core
        core.on('pan.ing', true, () => {
            const { lastPos, focusPos } = this._core
            this._translate(Vector.fromPoints(lastPos, focusPos))
        })
        core.on('zoom.ing', true, (e: WheelEvent) => {
            const { focusPos } = this._core
            this._zoomAt(e.deltaY, focusPos)
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

    private _translate(delta: Vector) {
        this.originBias = this.originBias.shift(delta.divide(this.logicWidth))
    }

    private _zoomAt(angle: number, center: Point) {
        const { logicWidth: length, originBias: origin } = this
        const factor = -this.zoomStep / 293.33 * 5 / this.gridWidthFactor
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
}