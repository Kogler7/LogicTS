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
import { Point } from "@/logic/common/types2D"

export default class MoveObjectLayer extends LogicLayer {

    public onMount() {
        this.core!.on("movobj.logic.begin", true, this.onMoveObjectBegin.bind(this))
        this.core!.on("movobj.logic.end", true, this.onMoveObjectEnd.bind(this))
        this.core!.on("movobj.logic.ing", true, this.onMovingObject.bind(this))
    }

    public onMoveObjectBegin() {
        console.log("start moving")
        this.core!.renderAll()
    }

    public onMoveObjectEnd() {
        console.log("end moving")
        this.core!.renderAll()
    }

    public onMovingObject(oldPos: Point, newPos: Point): boolean {
        // this.rect.x += newPos.x - oldPos.x
        // this.rect.y += newPos.y - oldPos.y
        console.log("moving", oldPos.desc, newPos.desc)
        return false
    }

    public onPaint(ctx: CanvasRenderingContext2D): boolean {
        return false
    }
}