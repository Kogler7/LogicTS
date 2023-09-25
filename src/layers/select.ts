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
import { ISelectable } from "@/logic/mixins/selectable"

export default class SelectLayer extends LogicLayer {
    private _cache: CanvasRenderingContext2D | null = null
    public onMounted(): void {
        const core = this.core!
        const cornerSize = 6
        const halfCorner = cornerSize / 2
        this._cache = core.createCache()
        const onChanged = () => {
            const cacheCtx = this._cache!
            cacheCtx.strokeStyle = "#364fc7"
            cacheCtx.lineWidth = 1
            cacheCtx.clearRect(0, 0, core.stageWidth, core.stageHeight)
            cacheCtx.setLineDash([])
            const selectedObjects = core.selectedLogicObjects
            // if no object is selected, just return
            if (selectedObjects.size === 0) {
                core.render()
                return
            }
            // if only one object is selected, it may be a resizable object
            if (selectedObjects.size === 1) {
                const obj = selectedObjects.values().next().value as ISelectable
                if (core.isResizable(obj.id)) {
                    // for resizable object, draw four corners and extra four small rectangles
                    // at left center, right center, top center and bottom center
                    const boundRect = core.crd2posRect(obj.rect).padding(cornerSize).float()
                    cacheCtx.strokeRect(...boundRect.ltwh)
                    cacheCtx.beginPath()
                    for (const corner of boundRect.corners) {
                        const cornerRect = new Rect(
                            corner.minus(new Point(halfCorner, halfCorner)),
                            new Size(cornerSize, cornerSize)
                        )
                        cacheCtx.clearRect(...cornerRect.ltwh)
                        cacheCtx.rect(...cornerRect.ltwh)
                    }
                    for (const edgeCenter of boundRect.edgeCenters) {
                        const edgeCenterRect = new Rect(
                            edgeCenter.minus(new Point(halfCorner, halfCorner)),
                            new Size(cornerSize, cornerSize)
                        )
                        cacheCtx.clearRect(...edgeCenterRect.ltwh)
                        cacheCtx.rect(...edgeCenterRect.ltwh)
                    }
                    cacheCtx.stroke()
                    core.render()
                    return
                }
            }
            // if more than one object is selected, draw a rectangle for each object
            cacheCtx.beginPath()
            const rects = [...selectedObjects].map(
                obj => core.crd2posRect(obj.rect).padding(cornerSize).float()
            )
            // draw a close bounding rectangle for all selected objects
            for (const r of rects) {
                if (core.zoomLevel < 2) {
                    cacheCtx.rect(...r.ltwh)
                }
            }
            // draw four corners for the bounding rectangle
            const boundRect = core.crd2posRect(core.selectedLogicBoundRect).padding(cornerSize).float()
            const corners = boundRect.padding(halfCorner).corners
            for (const corner of corners) {
                const cornerRect = new Rect(
                    corner.minus(new Point(halfCorner, halfCorner)),
                    new Size(cornerSize, cornerSize)
                )
                cacheCtx.rect(...cornerRect.ltwh)
            }
            cacheCtx.stroke()
            cacheCtx.setLineDash([5, 5])
            cacheCtx.strokeRect(...boundRect.ltwh)
            cacheCtx.setLineDash([])
            core.render()
        }
        core.on("select.logic-changed", onChanged)
        core.on("reloc", onChanged)
        core.on('memory.switch.after', onChanged)
    }

    public onPaint(ctx: CanvasRenderingContext2D): boolean {
        const { stageWidth, stageHeight } = this.core!
        ctx.drawImage(this._cache!.canvas, 0, 0, stageWidth, stageHeight)
        return true
    }
}