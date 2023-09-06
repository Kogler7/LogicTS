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
* Created: Sep. 6, 2023
* Supported by: National Key Research and Development Program of China
*/

import LogicLayer from "../logic/layer"
import { Point } from "@/logic/common/types2D"

export default class ScalarLayer extends LogicLayer {
    public onReloc(ctx: CanvasRenderingContext2D): boolean {
        ctx.font = "14px Arial"
        ctx.fillStyle = "rgba(100, 100, 100, 1)"
        const offset = 10
        const { gridWidth, levelUpFactor, originBias: origin, logicWidth } = this.core!
        const step = gridWidth * levelUpFactor
        const startPos = this.core!.crd2pos(new Point(0, 0)).mod(step).float()
        for (let x = startPos.x; x < this.core!.stageWidth; x += step) {
            const text = Math.floor(x / logicWidth - origin.x).toString()
            ctx.fillText(text, x + offset, offset * 2)
        }
        for (let y = startPos.y; y < this.core!.stageHeight; y += step) {
            const text = Math.floor(y / logicWidth - origin.y).toString()
            ctx.fillText(text, offset, y + offset * 2)
        }
        return true
    }
}