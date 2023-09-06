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

export default class MeshLayer extends LogicLayer {
    private _showBaseLines: boolean = true

    public onMount() {
        this.core?.on("reloc.begin", true, () => {
            this._showBaseLines = false
        })
        this.core?.on("reloc.end", true, () => {
            this._showBaseLines = true
        })
    }

    public onReloc(ctx: CanvasRenderingContext2D): boolean {
        const origin = new Point(0, 0)
        // draw mesh
        const { stageWidth, stageHeight, gridWidth, levelUpFactor } = this.core!
        // console.log(gridWidth)
        let startPos = this.core!.crd2pos(origin).mod(gridWidth).float()
        // draw base lines
        if (this._showBaseLines) {
            ctx.beginPath()
            ctx.strokeStyle = "rgba(200, 200, 200, 0.2)"
            ctx.lineWidth = 1
            for (let x = startPos.x; x < stageWidth; x += gridWidth) {
                ctx.moveTo(x, 0)
                ctx.lineTo(x, stageHeight)
            }
            for (let y = startPos.y; y < stageHeight; y += gridWidth) {
                ctx.moveTo(0, y)
                ctx.lineTo(stageWidth, y)
            }
            ctx.stroke()
        }
        // draw locating lines
        ctx.beginPath()
        ctx.strokeStyle = "rgba(200, 200, 200, 0.5)"
        ctx.lineWidth = 1
        const step = gridWidth * levelUpFactor
        startPos = this.core!.crd2pos(origin).mod(step).float()
        for (let x = startPos.x; x < stageWidth; x += step) {
            ctx.moveTo(x, 0)
            ctx.lineTo(x, stageHeight)
        }
        for (let y = startPos.y; y < stageHeight; y += step) {
            ctx.moveTo(0, y)
            ctx.lineTo(stageWidth, y)
        }
        ctx.stroke()
        return true
    }
}