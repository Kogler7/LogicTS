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
* Created: Sep. 15, 2023
* Supported by: National Key Research and Development Program of China
*/

import { Point, Rect } from "@/logic/common/types2D"
import { uid_rt } from "@/logic/common/uid"
import IRenderable from "@/logic/mixins/renderable"
import LogicCore from "@/logic/core"
import { IObjectArena } from "@/logic/arena/arena"
import { Flexible } from "@/logic/mixins/flexible"
import { FontStyle, LogicText } from "@/logic/utils/text"
import { IDisposable } from "@/logic/common/types"

export default class TextArea extends Flexible implements IRenderable, IDisposable {
    private _moving: boolean = false
    private _resizing: boolean = false
    private _arena: IObjectArena | null = null
    private _text: LogicText
    private _cacheCtx: CanvasRenderingContext2D | null = null

    constructor(rect: Rect, text: string = "", style: FontStyle = {}) {
        super(uid_rt(), 0, rect)
        this._text = new LogicText(this.rect, text, style)
    }

    dispose(): void {
        this.core!.destroyCache(this._cacheCtx!)
    }

    private _updateCache() {
        console.log("update cache")
        const realRect = this.core!.crd2posRect(this.rect).float().scale(4)
        realRect.moveTo(Point.zero())
        if (this._cacheCtx) {
            this.core!.resizeCache(this._cacheCtx, realRect.size)
        } else {
            this._cacheCtx = this.core!.createCache(realRect.size)
        }
        this._text.renderAt(this._cacheCtx, realRect)
    }

    public onRegistered(core: LogicCore): void {
        super.onRegistered(core)
        this._text.setCore(core)
        this._arena = core.logicArena
        this._updateCache()
        core.on("movobj.logic.finish", true, this.onMoveFinished.bind(this))
        core.on("resizobj.logic.finish", true, this.onResizeFinished.bind(this))
        core.on("zoom.end", true, this._updateCache.bind(this))
    }

    public renderAt(ctx: CanvasRenderingContext2D, rect: Rect): Rect {
        ctx.drawImage(this._cacheCtx!.canvas, ...rect.ltwh)
        ctx.strokeStyle = "red"
        ctx.strokeRect(...rect.ltwh)
        return rect
    }

    public renderOn(ctx: CanvasRenderingContext2D) {
        const renderRect = this.core!.crd2posRect(this.rect).float()
        const rect = this.renderAt(ctx, renderRect)
        // if this component is moving or resizing, render a mask
        if (this._moving || this._resizing) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.5)"
            ctx.fillRect(...rect.ltwh)
        }
    }

    public onMoveBegin(): void {
        this._moving = true
    }

    public onMoveEnd(): void {
        const success = this._arena!.setObject(this.id, this.target)
        if (success) {
            this.rect = this.target
        }
    }

    public onMoveFinished(): void {
        this._moving = false
        this.core!.renderAll()
    }

    public onMoving(oldPos: Point, newPos: Point): boolean {
        const occupied = this._arena!.rectOccupied(this.target, this.id, true)
        return occupied === null
    }

    public onResizeBegin(): void {
        this._resizing = true
    }

    public onResizeEnd(): void {
        const success = this._arena!.setObject(this.id, this.target)
        if (success) {
            this.rect = this.target
        }
    }

    public onResizeFinished(): void {
        this._resizing = false
        this._updateCache()
        this.core!.renderAll()
    }

    public onResizing(oldRect: Rect, newRect: Rect): boolean {
        const occupied = this._arena!.rectOccupied(newRect, this.id, true)
        return occupied === null
    }
}