import LogicCore from "../core"
import { Point, Rect } from "../common/types2D"
import Timer from "../utils/timer"

export default class EventHandler {
    private _core: LogicCore

    private _framed = false
    private _framing = false
    private _zooming = false
    private _sliding = false
    private _dragging = false
    private _updating = false

    private _targetEl: HTMLElement | null = null

    private _lastPos: Point = new Point()
    private _focusPos: Point = new Point()
    private _focusRect: Rect | null = null

    private _altKey = false
    private _ctrlKey = false
    private _shiftKey = false

    private _countdownTimer: Timer | null = null

    // make sure the context of these functions is EventHandler
    private _handleMouseDown = this._onMouseDown.bind(this)
    private _handleMouseMove = this._onMouseMove.bind(this)
    private _handleMouseUp = this._onMouseUp.bind(this)
    private _handleWheel = this._onWheel.bind(this)
    private _handleKeyDown = this._onKeyDown.bind(this)
    private _handleKeyUp = this._onKeyUp.bind(this)

    constructor(core: LogicCore) {
        this._core = core
        console.log(this._core)
    }

    public bind(el: HTMLElement) {
        console.log("bind", this._core)
        el.addEventListener('mousedown', this._handleMouseDown)
        el.addEventListener('mousemove', this._handleMouseMove)
        el.addEventListener('mouseup', this._handleMouseUp)
        el.addEventListener('wheel', this._handleWheel)
        el.addEventListener('keydown', this._handleKeyDown)
        el.addEventListener('keyup', this._handleKeyUp)
        el.setAttribute('tabindex', '0') // make it focusable
        this._targetEl = el
    }

    public unbind() {
        if (this._targetEl) {
            this._targetEl.removeEventListener('mousedown', this._handleMouseDown)
            this._targetEl.removeEventListener('mousemove', this._handleMouseMove)
            this._targetEl.removeEventListener('mouseup', this._handleMouseUp)
            this._targetEl.removeEventListener('wheel', this._handleWheel)
            this._targetEl.removeEventListener('keydown', this._handleKeyDown)
            this._targetEl.removeEventListener('keyup', this._handleKeyUp)
        }
    }

    private _tryStartViewUpdate() {
        if (this._updating) return
        this._updating = true
        this._core.fire('update.begin')
    }

    private _tryEndViewUpdate() {
        if (!this._updating) return
        if (this._zooming || this._sliding || this._dragging) return
        this._updating = false
        this._core.fire('update.end')
    }

    private _onMouseDown(e: MouseEvent) {
        if (!this._core.emit('mousedown', e)) return
        this._lastPos = new Point(e.offsetX, e.offsetY)
        // left button
        if (e.button === 0) {
            if (!this._core.emit('leftdown', e)) return
            this._framed = false
            this._framing = true
            this._focusPos = this._lastPos
            this._focusRect = null
            this._core.fire('frame.begin', e)
        }
        // middle button
        else if (e.button === 1) {
            if (!this._core.emit('middown', e)) return
            this._sliding = !this._sliding
            if (this._sliding) {
                this._core.setCursor('all-scroll')
                this._core.fire('slide.begin', e, this._lastPos)
                this._tryStartViewUpdate()
            }
            else {
                this._core.popCursor('all-scroll')
                this._core.fire('slide.end', e, this._lastPos)
                this._tryEndViewUpdate()
            }
        }
        // right button
        else if (e.button === 2) {
            if (!this._core.emit('rightdown', e)) return
            if (this._sliding) return
            this._dragging = true
            this._core.setCursor('grabbing')
            this._core.fire('drag.begin', e, this._lastPos)
            this._tryStartViewUpdate()
        }
    }

    private _onMouseMove(e: MouseEvent) {
        if (!this._core.emit('mousemove', e)) return
        if (this._sliding) return
        else if (this._dragging) {
            this._core.fire('drag.move', e)
        }
        else if (this._framing) {
            this._framed = true
            const pos = new Point(e.offsetX, e.offsetY)
            const rect = Rect.fromVertices(this._lastPos, pos)
            this._focusRect = rect
            this._core.fire('frame.move', e, rect)
        } else if (!this._framed) {
            this._focusPos = new Point(e.offsetX, e.offsetY)
            this._core.fire('hover', e, this._focusPos)
        }
    }

    private _onMouseUp(e: MouseEvent) {
        if (!this._core.emit('mouseup', e)) return
        if (this._dragging) {
            this._dragging = false
            this._core.popCursor('grabbing')
            this._core.fire('drag.end', e)
            this._tryEndViewUpdate()
        }
        else if (this._framing) {
            this._framing = false
            this._core.fire('frame.end', e, this._focusRect)
        }
    }

    private _onWheel(e: WheelEvent) {
        if (!this._core.emit('wheel', e)) return
        if (this._sliding) return
        if (!this._zooming) {
            this._core.fire('zoom.begin', e)
            this._tryStartViewUpdate()
            this._countdownTimer = new Timer(() => {
                this._zooming = false
                this._core.fire('zoom.end', e)
                this._tryEndViewUpdate()
                this._countdownTimer = null
            })
        }
        this._zooming = true
        this._countdownTimer?.reset()
        this._core.fire('zoom.act', e)
    }

    private _onKeyDown(e: KeyboardEvent) {
        if (!this._core.emit('keydown', e)) return
        console.log('key down')
    }

    private _onKeyUp(e: KeyboardEvent) {
        if (!this._core.emit('keyup', e)) return
        console.log('key up')
    }
} 