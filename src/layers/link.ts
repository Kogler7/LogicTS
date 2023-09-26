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
* Created: Sep. 26, 2023
* Supported by: National Key Research and Development Program of China
*/

import { uid } from "@/logic/common/uid"
import LogicCore from "@/logic/core"
import LogicLayer from "../logic/layer"
import { Point, Rect } from "@/logic/common/types2D"
import { IMovable } from "@/logic/mixins/movable"

export default class LinkLayer extends LogicLayer {
    private _objectIds: Set<uid> = new Set()

    public onMounted(core: LogicCore): void {
        this._objectIds = core.logicObjectIds
        core.on('memory.switch.after', () => {
            this._objectIds = core.logicObjectIds
        })
    }

    public onCache(ctx: CanvasRenderingContext2D): boolean {
        return true
    }

    public onPaint(ctx: CanvasRenderingContext2D): boolean {
        const crd2pos = this.core?.crd2pos.bind(this.core)!
        const objs = this._objectIds.values()
        if (objs.next().done) {
            return false
        }
        const obj1 = this.core?.getObject(objs.next().value)! as IMovable
        const obj2 = this.core?.getObject(objs.next().value)! as IMovable
        if (!obj1 || !obj2) {
            return false
        }
        const from = new Point(obj1.target.right, obj1.target.centerY)
        const to = new Point(obj2.target.left, obj2.target.centerY)
        const bound = Rect.fromVertices(from, to)
        const c1 = new Point(obj1.target.right + bound.width / 2, obj1.target.centerY)
        const c2 = new Point(obj2.target.left - bound.width / 2, obj2.target.centerY)
        const fromPos = crd2pos(from)
        const toPos = crd2pos(to)
        const c1Pos = crd2pos(c1)
        const c2Pos = crd2pos(c2)
        ctx.strokeStyle = 'black'
        ctx.beginPath()
        ctx.moveTo(fromPos.x, fromPos.y)
        ctx.bezierCurveTo(c1Pos.x, c1Pos.y, c2Pos.x, c2Pos.y, toPos.x, toPos.y)
        ctx.stroke()
        return true
    }
}