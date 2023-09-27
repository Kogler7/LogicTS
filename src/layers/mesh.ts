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
import { Animation, Curves } from "@/logic/utils/anime"

export default class MeshLayer extends LogicLayer {
    private _showBaseLines: boolean = true
    private _baseLineOpacity: number = 0.2
    private _origin: Point = Point.zero()

    public onMounted() {
        this.core?.on("reloc.begin", () => {
            this._showBaseLines = false
        })
        this.core?.on("reloc.end", () => {
            this._showBaseLines = true
            this._baseLineOpacity = 0
            const anime = new Animation(
                (progress: number) => {
                    this._baseLineOpacity = progress * 0.2
                    this.core?.render()
                },
                300,
                Curves.easeInOut,
                () => { this._baseLineOpacity = 0 },
                () => { this._baseLineOpacity = 0.2 }
            )
            anime.start()
        })
    }

    public onCache(ctx: CanvasRenderingContext2D): boolean {
        // draw mesh
        const { stageWidth, stageHeight, gridWidth, levelUpFactor } = this.core!
        // console.log(gridWidth)
        let startPos = this.core!.crd2pos(this._origin).mod(gridWidth).float()
        // draw locating lines
        ctx.beginPath()
        ctx.strokeStyle = "rgba(200, 200, 200, 0.5)"
        ctx.lineWidth = 1
        const step = gridWidth * levelUpFactor
        startPos = this.core!.crd2pos(this._origin).mod(step).float()
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

    public onPaint(ctx: CanvasRenderingContext2D): boolean {
        if (this._showBaseLines) {
            // draw mesh
            const { stageWidth, stageHeight, gridWidth } = this.core!
            // console.log(gridWidth)
            let startPos = this.core!.crd2pos(this._origin).mod(gridWidth).float()
            // draw base lines
            ctx.beginPath()
            ctx.strokeStyle = `rgba(200, 200, 200, ${this._baseLineOpacity})`
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
            return true
        }
        return false
    }
}