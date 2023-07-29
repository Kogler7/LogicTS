import { Point, Vector } from "../common/types2D"
import LogicCore from "../core"

export default class LayoutHandler {
    private _core: LogicCore
    private _targetEl: HTMLElement | null = null

    private _cache: Map<HTMLElement, any> = new Map()

    public logicOrigin: Point = new Point()
    public logicLength: number = 25

    public zoomStep: number = 0.1
    public zoomLevel: number = 0
    public levelMax: number = 2
    public levelUpFactor: number = 4
    public gridWidthMin: number = 10
    public gridWidthMax: number = this.gridWidthMin * this.levelUpFactor
    public gridWidthFactor: number = this.levelUpFactor ** this.zoomLevel
    public gridWidth: number = this.logicLength * this.gridWidthFactor

    constructor(core: LogicCore) {
        this._core = core
        core.on('drag.ing', true, () => {
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
            this.logicOrigin = cachedData.logicOrigin
            this.logicLength = cachedData.logicLength
        }
    }

    public unbind() {
        if (this._targetEl) {
            this._cache.set(this._targetEl, {
                logicOrigin: this.logicOrigin,
                logicLength: this.logicLength
            })
        }
        this._targetEl = null
    }

    public crd2pos(crd: Point): Point {
        const { logicOrigin: origin, logicLength: length } = this
        return crd.plus(origin).times(length)
    }

    public pos2crd(pos: Point): Point {
        const { logicOrigin: origin, logicLength: length } = this
        return pos.divide(length).minus(origin)
    }

    private _translate(delta: Vector) {
        this.logicOrigin = this.logicOrigin.shift(delta.divide(this.logicLength))
    }

    private _zoomAt(angle: number, center: Point) {
        const { logicLength: length, logicOrigin: origin } = this
        const factor = -this.zoomStep / 293.33 * 5
        const delta = angle * factor
        const lastCtrCrd = this.pos2crd(center)
        // update logicLength and logicOrigin
        this.logicLength = length + delta
        const newCtrCrd = this.pos2crd(center)
        const crdBias = Vector.fromPoints(lastCtrCrd, newCtrCrd)
        this.logicOrigin = origin.shift(crdBias)
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
        this.gridWidth = this.logicLength * this.gridWidthFactor
    }
}