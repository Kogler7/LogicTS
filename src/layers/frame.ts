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

import { Rect } from '@/logic/common/types2D'
import LogicLayer from '../logic/layer'

export default class FrameLayer extends LogicLayer {
    public onCache(ctx: CanvasRenderingContext2D): boolean {
        const rect = Rect.fromLTWH(
            0,
            0,
            this.core!.stageWidth - 2,
            this.core!.stageHeight - 2,
        ).float()
        ctx.strokeStyle = '#000000'
        ctx.lineWidth = 0.5
        ctx.strokeRect(...rect.ltwh)
        return true
    }

    public onPaint(ctx: CanvasRenderingContext2D): boolean {
        // 绘制边框
        const rect = this.core?.focusRect?.float()
        if (rect) {
            ctx.fillStyle = 'rgba(200, 200, 255, 0.1)'
            ctx.fillRect(rect.left, rect.top, rect.width, rect.height)
            ctx.strokeStyle = 'rgba(200, 200, 255, 0.5)'
            ctx.lineWidth = 1
            ctx.strokeRect(rect.left, rect.top, rect.width, rect.height)
        }
        // 写一行字
        ctx.font = '16.5px Consolas'
        ctx.fillStyle = '#ff0000'
        // ctx.textRendering = "optimizeLegibility"
        const text = `level: ${this.core!.zoomLevel}; Memo: ${this.core!.currentMemoryId}; ${this.core!.perf}`
        ctx.fillText(text, 40, 50)
        return true
    }
}
