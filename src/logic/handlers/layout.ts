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
* Created: Jul. 29, 2023
* Supported by: National Key Research and Development Program of China
*/

import { Point, Rect, Vector } from "../common/types2D"
import LogicCore from "../core"
import { Animation, Curves } from "../utils/anime"
import LogicConfig from "../config"

export default class LayoutHandler {
    private _core: LogicCore

    private _config = LogicConfig.core.layout

    public originBias: Point = new Point()
    public logicWidth: number = this._config.logicWidth // 25 pixels per logic unit by default

    public logicWidthMin: number = this._config.logicWidthMin // 1 pixel per logic unit at least
    public logicWidthMax: number = this._config.logicWidthMax // 100 pixels per logic unit at most

    public zoomSpeed: number = this._config.zoomSpeed // logic unit per wheel event (deltaY)
    public zoomLevel: number = this._config.zoomLevel // current zoom level, 0 by default
    public zoomLevelMin: number = this._config.zoomLevelMin // 0 levels at least
    public zoomLevelMax: number = this._config.zoomLevelMax // 2 levels at most
    public levelUpFactor: number = this._config.levelUpFactor // four times bigger each level
    public gridWidthMin: number = this._config.gridWidthMin // pixels per grid at least
    public gridWidthMax: number = this.gridWidthMin * this.levelUpFactor // pixels per grid at most
    public gridWidthFactor: number = this.levelUpFactor ** this.zoomLevel // 1, 4, 16...
    public gridWidth: number = this.logicWidth * this.gridWidthFactor // pixels per grid (logic unit)

    private _sliding = false
    private _slideVector: Vector = new Vector()

    constructor(core: LogicCore) {
        this._core = core
        core.malloc('__layout__', {
            originBias: this.originBias,
            logicWidth: this.logicWidth,
            zoomLevel: this.zoomLevel,
        }, (value: any) => {
            value.originBias = this.originBias
            value.logicWidth = this.logicWidth
            value.zoomLevel = this.zoomLevel
        }, (value: any) => {
            this.originBias = value.originBias
            this.logicWidth = value.logicWidth
            this.zoomLevel = value.zoomLevel
            this.gridWidthFactor = this.levelUpFactor ** this.zoomLevel
            this.gridWidth = this.logicWidth * this.gridWidthFactor
        })
        core.on('pan.ing', () => {
            const { lastPos, focusPos } = this._core
            this._panTo(Vector.fromPoints(lastPos, focusPos))
        })
        core.on('zoom.ing', (e: WheelEvent) => {
            const { focusPos } = this._core
            this._zoomAt(e.deltaY, focusPos)
        })
        core.on('slide.ing', () => {
            const vec = Vector.fromPoints(
                this._core.focusPos,
                this._core.anchorPos
            ).divide(this.logicWidth * 30)
            this._slideVector = vec
        })
        core.on('slide.begin', () => {
            this._sliding = true
            this._slideVector = new Vector()
            this._trySlide()
        })
        core.on('slide.end', () => {
            this._sliding = false
            this._slideVector = new Vector()
        })
        // double click middle button to reset originBias
        core.on('doubleclick.middle', () => {
            const bias = this.originBias.clone()
            const anime = new Animation(
                (value: number) => {
                    this.originBias = bias.times(1 - value)
                    this._core.fire('reloc.ing')
                },
                300,
                Curves.easeInOut,
                () => { this._core.fire('reloc.begin') },
                () => { this._core.fire('reloc.end') }
            )
            anime.start()
        })
    }

    public crd2pos(crd: Point): Point {
        const { originBias: origin, logicWidth: length } = this
        return crd.plus(origin).times(length)
    }

    public crd2posRect(rect: Rect): Rect {
        const { originBias: origin, logicWidth: length } = this
        return new Rect(this.crd2pos(rect.pos), rect.size.times(length))
    }

    public pos2crd(pos: Point): Point {
        const { originBias: origin, logicWidth: length } = this
        return pos.divide(length).minus(origin)
    }

    public pos2crdRect(rect: Rect): Rect {
        const { originBias: origin, logicWidth: length } = this
        return new Rect(this.pos2crd(rect.pos), rect.size.divide(length))
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
            if (this.zoomLevel < this.zoomLevelMax) {
                this.zoomLevel++
            }
        }
        else if (this.gridWidth > this.gridWidthMax) {
            if (this.zoomLevel > this.zoomLevelMin) {
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
        this._core.fire('reloc.ing')
        requestAnimationFrame(this._trySlide.bind(this))
    }
}