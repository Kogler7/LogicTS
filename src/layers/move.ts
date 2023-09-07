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

import LogicLayer from "../logic/layer"
import { Point, Rect, Vector } from "@/logic/common/types2D"
import { IObject } from "@/logic/handlers/object"
import { uid } from "@/logic/common/uid"
import LogicCore from "@/logic/core"
import { stat } from "original-fs"
import { IRenderable } from "@/logic/mixins/renderable"

export default class MoveObjectLayer extends LogicLayer {
    private _moving: boolean = false
    private _movingFrameElapsed: number = 0
    private _movingObjects: Set<IObject> = new Set()
    private _movingObjectStates: Map<uid, boolean> = new Map()
    private _movingScaledObjectsBias: Map<uid, Vector> = new Map()
    private _movingScaledObjectsRect: Map<uid, Rect> = new Map()
    private _movingObjectInitialPos: Map<uid, Point> = new Map()
    private _movingObjectCurrentRect: Map<uid, Rect> = new Map()

    private _okColor: string = "#8BC34A"
    private _noColor: string = "#FF5722"

    public onMount(core: LogicCore) {
        this._movingObjects = core.movingLogicObjects
        this._movingObjectStates = core.movingLogicObjectStates
        core.on("movobj.logic.begin", true, this.onMoveObjectBegin.bind(this))
        core.on("movobj.logic.end", true, this.onMoveObjectEnd.bind(this))
        core.on("movobj.logic.ing", true, this.onMovingObject.bind(this))
    }

    private _onMovingAnimeFrame() {
        if (!this._moving) return
        this._movingFrameElapsed++
        this.core?.render()
        requestAnimationFrame(this._onMovingAnimeFrame.bind(this))
    }

    public onMoveObjectBegin(pos: Point) {
        console.log("start moving")
        this._moving = true
        // init moving objects bias
        for (const obj of this._movingObjects) {
            // if mouse pos is in the object, scale the object to the mouse pos
            // else scale the object to the its center
            let scaled: Rect
            if (obj.rect.containsPoint(pos)) {
                scaled = obj.rect.scale(0.7, pos)
            } else {
                scaled = obj.rect.scale(0.7, obj.rect.center)
            }
            this._movingScaledObjectsBias.set(obj.id, Vector.fromPoints(pos, scaled.pos))
            this._movingScaledObjectsRect.set(obj.id, scaled)
            this._movingObjectInitialPos.set(obj.id, obj.rect.pos.copy())
            this._movingObjectCurrentRect.set(obj.id, obj.rect.copy())
        }
        this._onMovingAnimeFrame()
        this.core!.renderAll()
    }

    public onMoveObjectEnd(pos: Point) {
        console.log("end moving")
        this._moving = false
        this._movingFrameElapsed = 0
        this._movingScaledObjectsBias.clear()
        this._movingScaledObjectsRect.clear()
        this._movingObjectInitialPos.clear()
        this._movingObjectCurrentRect.clear()
        this.core!.renderAll()
    }

    public onMovingObject(oldPos: Point, newPos: Point): boolean {
        for (const [id, rect] of this._movingScaledObjectsRect) {
            const bias = this._movingScaledObjectsBias.get(id)!
            rect.moveTo(newPos.shift(bias))
            const initPos = this._movingObjectInitialPos.get(id)!
            const curRect = this._movingObjectCurrentRect.get(id)!
            curRect.moveTo(initPos.plus(newPos.minus(oldPos)).round())
        }
        return false
    }

    public onPaint(ctx: CanvasRenderingContext2D): boolean {
        if (!this._moving) return false
        ctx.setLineDash([5, 5])
        ctx.lineDashOffset = -this._movingFrameElapsed / 2
        ctx.beginPath()
        for (const obj of this._movingObjects) {
            const curRect = this._movingObjectCurrentRect.get(obj.id)!
            const renderRect = this.core!.crd2posRect(curRect).float()
            const state = this._movingObjectStates.get(obj.id)
            ctx.strokeStyle = state ? this._okColor : this._noColor
            ctx.lineWidth = 2
            ctx.rect(...renderRect.ltwh)
        }
        // render scaled mini objects
        for (const obj of this._movingObjects) {
            const rect = this._movingScaledObjectsRect.get(obj.id)!
            const renderRect = this.core!.crd2posRect(rect).float();
            (obj as unknown as IRenderable).renderAt(ctx, renderRect)
        }
        ctx.stroke()
        ctx.setLineDash([])
        return true
    }
}