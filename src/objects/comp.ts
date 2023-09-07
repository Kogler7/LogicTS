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

export default class Component extends Movable implements IRenderable {
    private _moving: boolean = false

    constructor(pos: Point = Point.zero()) {
        super(uid_rt(), 0, new Rect(pos, new Size(4, 4)))
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

    public onSelected(): void {
        console.log("selected", this.id)
    }

    public onDeselected(): void {
        console.log("deselected", this.id)
    }

    public onRegistered(core: LogicCore): void {
        super.onRegistered(core)
        console.log("registered", this.id)
    }

    public onMoveBegin(): void {
        this._moving = true
    }

    public onMoveEnd(): void {
        this._moving = false
    }

    public onMoving(oldPos: Point, newPos: Point): boolean {
        // this.rect.x += newPos.x - oldPos.x
        // this.rect.y += newPos.y - oldPos.y
        console.log("moving", this.id, oldPos.desc, newPos.desc)
        return true
    }
}