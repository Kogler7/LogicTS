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

export default class FrameLayer extends LogicLayer {
    public onReloc(ctx: CanvasRenderingContext2D): boolean {
        ctx.strokeStyle = "#ff0000"
        ctx.lineWidth = 2
        ctx.strokeRect(0, 0, 1000, 800)
        return true
    }

    public onPaint(ctx: CanvasRenderingContext2D): boolean {
        // 绘制边框
        const rect = this.core?.focusRect?.float()
        if (rect) {
            ctx.fillStyle = "rgba(200, 200, 255, 0.1)"
            ctx.fillRect(rect.left, rect.top, rect.width, rect.height)
            ctx.strokeStyle = "rgba(200, 200, 255, 0.5)"
            ctx.lineWidth = 1
            ctx.strokeRect(rect.left, rect.top, rect.width, rect.height)
        }
        // 写一行字
        ctx.font = "16px Arial"
        ctx.fillStyle = "#ff0000"
        const text = `level: ${this.core!.zoomLevel}; ` + this.core!.fps
        ctx.fillText(text, 40, 50)
        return true
    }
}