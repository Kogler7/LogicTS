/**
 * Copyright (c) 2022 Beijing Jiaotong University
 * PhotLab is licensed under [Open Source License].
 * You can use this software according to the terms and conditions of the [Open Source License].
 * You may obtain a copy of [Open Source License] at: [https://open.source.license/]
 *
 * THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
 * EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
 * MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
 *
 * See the [Open Source License] for more details.
 *
 * Author: Zhenjie Wei
 * Created: Jul. 21, 2023
 * Supported by: National Key Research and Development Program of China
 */

import LogicCore from '../core'
import { Point, Rect, Vector } from '../common/types2D'
import Timer from '../utils/timer'

export default class EventHandler {
    private _core: LogicCore
    private _targetEl: HTMLElement | null = null

    private _disabled = true // disable when current memory id is 0

    private _framing = false
    private _zooming = false
    private _sliding = false
    private _panning = false
    private _updating = false

    private _frameStartPos: Point = new Point()

    public lastPos: Point = new Point()
    public anchorPos: Point = new Point()
    public focusPos: Point = new Point()
    public focusRect: Rect | null = null
    public focusLogicFloorRect: Rect = Rect.zero()

    private _altKey = false
    private _ctrlKey = false
    private _shiftKey = false

    private _countdownTimer: Timer = new Timer(() => {
        this._zooming = false
        this._core.fire('zoom.end')
        this._tryEndReloc()
    })
    private _waitingForDoubleClick = false

    // make sure the context of these functions is EventHandler
    private _handleMouseDown = this._onMouseDown.bind(this)
    private _handleMouseMove = this._onMouseMove.bind(this)
    private _handleMouseUp = this._onMouseUp.bind(this)
    private _handleWheel = this._onWheel.bind(this)
    private _handleKeyDown = this._onKeyDown.bind(this)
    private _handleKeyUp = this._onKeyUp.bind(this)

    constructor(core: LogicCore) {
        this._core = core
        // for any event, we should rerender part of the canvas
        core.on('finally', () => {
            core.render()
        })
        // for any event related to relocating, we should rerender the whole canvas
        core.on('reloc.finally', () => {
            core.renderAll()
        })
        // detect whether the current memory is valid
        core.on('memory.switch.after', (id: number) => {
            this._disabled = id === 0
        })
    }

    public connect(el: HTMLElement) {
        // bind event listeners to the target element, and set it focusable
        // so that we can receive keyboard and mouse events
        el.addEventListener('mousedown', this._handleMouseDown)
        el.addEventListener('mousemove', this._handleMouseMove)
        el.addEventListener('mouseup', this._handleMouseUp)
        el.addEventListener('wheel', this._handleWheel)
        el.addEventListener('keydown', this._handleKeyDown)
        el.addEventListener('keyup', this._handleKeyUp)
        el.setAttribute('tabindex', '0') // make it focusable
        this._targetEl = el
    }

    public disconnect() {
        // unbind event listeners from the target element
        // to prevent receiving unwanted events
        if (this._targetEl) {
            this._targetEl.removeEventListener(
                'mousedown',
                this._handleMouseDown,
            )
            this._targetEl.removeEventListener(
                'mousemove',
                this._handleMouseMove,
            )
            this._targetEl.removeEventListener('mouseup', this._handleMouseUp)
            this._targetEl.removeEventListener('wheel', this._handleWheel)
            this._targetEl.removeEventListener('keydown', this._handleKeyDown)
            this._targetEl.removeEventListener('keyup', this._handleKeyUp)
        }
    }

    private _tryStartReloc() {
        if (this._updating) return
        this._updating = true
        this._core.fire('reloc.begin')
    }

    private _tryEndReloc() {
        if (!this._updating) return
        if (this._zooming || this._sliding || this._panning) return
        this._updating = false
        this._core.fire('reloc.end')
    }

    private _onMouseDown(e: MouseEvent) {
        if (this._disabled) return
        if (!this._core.emit('mousedown', e)) return
        this.focusPos = new Point(e.offsetX, e.offsetY)
        this.anchorPos = this.focusPos
        // left button
        if (e.button === 0) {
            if (!this._core.emit('leftdown', e)) return
            this._framing = true
            this._frameStartPos = this.focusPos
            this.focusRect = null
            this.focusLogicFloorRect = Rect.zero()
            this._core.fire('frame.begin', e)
        }
        // middle button
        else if (e.button === 1) {
            if (!this._core.emit('middown', e)) return
            this._sliding = !this._sliding
            if (this._sliding) {
                this._core.setCursor('all-scroll')
                this._core.fire('slide.begin', e)
                this._tryStartReloc()
            } else {
                this._core.popCursor('all-scroll')
                this._core.fire('slide.end', e)
                this._tryEndReloc()
            }
        }
        // right button
        else if (e.button === 2) {
            if (!this._core.emit('rightdown', e)) return
            if (this._sliding) return
            this._panning = true
            this._core.setCursor('grabbing')
            this._core.fire('pan.begin', e)
            this._tryStartReloc()
        }
        this.lastPos = this.focusPos
        // check double click
        if (this._waitingForDoubleClick) {
            const button = ['left', 'middle', 'right'][e.button]
            this._core.fire('doubleclick.' + button, e)
        } else {
            this._waitingForDoubleClick = true
            setTimeout(() => {
                this._waitingForDoubleClick = false
            }, 300)
        }
    }

    private _onMouseMove(e: MouseEvent) {
        if (this._disabled) return
        if (!this._core.emit('mousemove', e)) return
        this.focusPos = new Point(e.offsetX, e.offsetY)
        if (this._sliding) {
            this._core.fire('slide.ing', e)
            this._core.fire('reloc.ing', e)
        } else if (this._panning) {
            this._core.fire('pan.ing', e)
            this._core.fire('reloc.ing', e)
        } else if (this._framing) {
            const rect = Rect.fromVertices(this._frameStartPos, this.focusPos)
            this.focusRect = rect
            const newFloorRect = this._core.pos2crdRect(rect).shrink()
            if (!this.focusLogicFloorRect?.equals(newFloorRect)) {
                this._core.fire(
                    'frame.change',
                    this.focusLogicFloorRect,
                    newFloorRect,
                )
                this.focusLogicFloorRect = newFloorRect
            }
            this._core.fire('frame.ing', e, rect)
        }
        this._core.fire('hover', e)
        this.lastPos = this.focusPos
    }

    private _onMouseUp(e: MouseEvent) {
        if (this._disabled) return
        if (!this._core.emit('mouseup', e)) return
        if (this._panning) {
            this._panning = false
            this._core.popCursor('grabbing')
            this._core.fire('pan.end', e)
            this._tryEndReloc()
        } else if (this._framing) {
            this._framing = false
            this.focusRect = null
            this._core.fire('frame.end', e)
        }
    }

    private _onWheel(e: WheelEvent) {
        if (this._disabled) return
        if (!this._core.emit('wheel', e)) return
        if (this._sliding) return
        if (this._ctrlKey) {
            if (!this._zooming) {
                this._core.fire('zoom.begin', e)
                this._tryStartReloc()
            }
            this._zooming = true
            this._countdownTimer.reset().start()
            this._core.fire('zoom.ing', e)
            this._core.fire('reloc.ing', e)
        } else if (this._shiftKey) {
            this._tryStartReloc()
            this._core.panTo(new Vector(-e.deltaY, 0))
            this._tryEndReloc()
        } else {
            this._tryStartReloc()
            this._core.panTo(new Vector(0, -e.deltaY))
            this._tryEndReloc()
        }
    }

    private _onKeyDown(e: KeyboardEvent) {
        if (this._disabled) return
        if (!this._core.emit('keydown', e)) return
        let modifiers = ''
        if (e.key === 'Alt') {
            this._altKey = true
        } else if (e.key === 'Control') {
            this._ctrlKey = true
        } else if (e.key === 'Shift') {
            this._shiftKey = true
        } else {
            modifiers =
                (this._ctrlKey ? 'control.' : '') +
                (this._shiftKey ? 'shift.' : '') +
                (this._altKey ? 'alt.' : '')
        }
        const event = 'keydown.' + modifiers + e.key.toLowerCase()
        this._core.fire(event, e)
    }

    private _onKeyUp(e: KeyboardEvent) {
        if (this._disabled) return
        if (!this._core.emit('keyup', e)) return
        let modifiers = ''
        if (e.key === 'Alt') {
            this._altKey = false
        } else if (e.key === 'Control') {
            this._ctrlKey = false
        } else if (e.key === 'Shift') {
            this._shiftKey = false
        } else {
            modifiers =
                (this._ctrlKey ? 'control.' : '') +
                (this._shiftKey ? 'shift.' : '') +
                (this._altKey ? 'alt.' : '')
        }
        const event = 'keyup.' + modifiers + e.key.toLowerCase()
        this._core.fire(event, e)
    }
}
