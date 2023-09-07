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
import { Point, Rect, Size } from "@/logic/common/types2D"

export default class SelectLayer extends LogicLayer {
    private _cache: CanvasRenderingContext2D | null = null
    public onMount(): void {
        const core = this.core!
        const cornerSize = 6
        const halfCorner = cornerSize / 2
        this._cache = core.createCache()
        this._cache.strokeStyle = "#364fc7"
        this._cache.lineWidth = 1
        const onChanged = (() => {
            this._cache!.clearRect(0, 0, core.stageWidth, core.stageHeight)
            const rects = [...core.selectedLogicObjects]
                .map(obj => core.crd2posRect(obj.rect).padding(cornerSize).float())
            if (rects.length > 0) {
                this._cache?.setLineDash([])
                for (const r of rects) {
                    if (core.zoomLevel < 2) {
                        this._cache?.strokeRect(...r.ltwh)
                    }
                }
                // draw four corners
                const boundRect = core.crd2posRect(core.selectedLogicBoundRect).padding(cornerSize).float()
                const corners = boundRect.padding(halfCorner).vertices
                for (const corner of corners) {
                    const cornerRect = new Rect(
                        corner.minus(new Point(halfCorner, halfCorner)),
                        new Size(cornerSize, cornerSize)
                    )
                    this._cache?.strokeRect(...cornerRect.ltwh)
                }
                this._cache?.setLineDash([5, 5])
                this._cache?.strokeRect(...boundRect.ltwh)
            }
            core.render()
        }).bind(this)
        core.on("select.logic-changed", true, onChanged)
        core.on("reloc", true, onChanged)
    }

    public onPaint(ctx: CanvasRenderingContext2D): boolean {
        const { stageWidth, stageHeight } = this.core!
        ctx.drawImage(this._cache!.canvas, 0, 0, stageWidth, stageHeight)
        return true
    }
}