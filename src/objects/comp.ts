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
* Created: Sep. 7, 2023
* Supported by: National Key Research and Development Program of China
*/

import { Point, Rect, Size } from "@/logic/common/types2D"
import { uid_rt, uid2hex } from "@/logic/common/uid"
import { IRenderable } from "@/logic/mixins/renderable"
import { Movable } from "@/logic/mixins/movable"
import LogicCore from "@/logic/core"
import { IObjectArena } from "@/logic/arena/arena"
import { IResizable } from "@/logic/mixins/resizable"

export default class Component extends Movable implements IRenderable, IResizable {
    private _moving: boolean = false
    private _arena: IObjectArena | null = null

    constructor(pos: Point = Point.zero()) {
        super(uid_rt(), 0, new Rect(pos, new Size(4, 4)))
    }

    public onRegistered(core: LogicCore): void {
        super.onRegistered(core)
        core.setResizable(this, true)
        this._arena = core.logicArena
    }

    public renderAt(ctx: CanvasRenderingContext2D, rect: Rect): Rect {
        const color = uid2hex(this.id)
        if (!this._moving) {
            ctx.strokeStyle = "#000000"
            ctx.lineWidth = 1
            ctx.strokeRect(...rect.ltwh)
        }
        ctx.fillStyle = color
        ctx.fillRect(...rect.ltwh)
        return rect
    }

    public renderOn(ctx: CanvasRenderingContext2D) {
        const renderRect = this.core!.crd2posRect(this.rect).float()
        const rect = this.renderAt(ctx, renderRect)
        // if this component is moving, render a mask
        if (this._moving) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.5)"
            ctx.fillRect(...rect.ltwh)
        }
    }

    public onMoveBegin(): void {
        this._moving = true
    }

    public onMoveEnd(): void {
        this._moving = false
        const success = this._arena!.setObject(this.id, this.target)
        if (success) {
            this.rect = this.target
        }
    }

    public onMoving(oldPos: Point, newPos: Point): boolean {
        const occupied = this._arena!.rectOccupied(this.target, this.id, true)
        return occupied === null
    }

    public onResizeBegin(): void {
        // console.log("resize begin", this.id)
    }

    public onResizeEnd(): void {
        const success = this._arena!.setObject(this.id, this.target)
        if (success) {
            this.rect = this.target
        }
    }

    public onResizing(oldRect: Rect, newRect: Rect): boolean {
        const occupied = this._arena!.rectOccupied(newRect, this.id, true)
        return occupied === null
    }
}