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
* Created: Sep. 8, 2023
* Supported by: National Key Research and Development Program of China
*/

import LogicLayer from "../logic/layer"
import { Rect } from "@/logic/common/types2D"
import LogicCore from "@/logic/core"
import { Animation, Curves } from "@/logic/utils/anime"
import { IResizable } from "@/logic/mixins/resizable"

export default class ResizeObjectLayer extends LogicLayer {
    private _resizing: boolean = false
    private _resizingFrameElapsed: number = 0
    private _resizingLogicObject: IResizable[] = []
    private _resizingLogicObjectState: boolean[] = []
    private _currentTargetObjectRect: Rect = Rect.zero()

    private _targetAnimating: boolean = false

    private _okColor: string = "#8BC34A"
    private _noColor: string = "#FF5722"

    public onMount(core: LogicCore) {
        this._resizingLogicObject = core.resizingLogicObject
        this._resizingLogicObjectState = core.resizingLogicObjectState
        core.on("resizobj.logic.begin", true, this._onResizeObjectBegin.bind(this))
        core.on("resizobj.logic.end", true, this._onResizeObjectEnd.bind(this))
        core.on("resizobj.logic.step", true, this._onResizingObjectStep.bind(this))
    }

    private _updateAnimeFrame() {
        if (!this._resizing) return
        this._resizingFrameElapsed++
        this.core?.render()
        requestAnimationFrame(this._updateAnimeFrame.bind(this))
    }

    private _onResizeObjectBegin(rect: Rect) {
        this._resizing = true
        this._currentTargetObjectRect = rect
        this._updateAnimeFrame()
        this.core!.renderAll()
    }

    private _onResizeObjectEnd() {
        this._resizingFrameElapsed = 0
        // start scale animation
        const obj = this._resizingLogicObject[0]
        const oldTarget = this._currentTargetObjectRect.copy()
        const targetAnime = new Animation(
            (progress: number) => {
                this._currentTargetObjectRect = oldTarget.lerp(obj.rect, progress)
                this.core!.render()
            },
            150,
            Curves.easeInOut,
            () => {
                this._targetAnimating = true
            },
            () => {
                this._targetAnimating = false
                this._resizing = false
            }
        )
        targetAnime.start()
        this.core!.fire("update-bound")
        this.core!.fire("select.logic-changed")
        this.core!.renderAll()
    }

    private _onResizingObjectStep(oldRect: Rect, newRect: Rect) {
        if (this._targetAnimating) return
        const obj = this._resizingLogicObject[0]
        const oldTarget = this._currentTargetObjectRect.copy()
        const moveTargetAnime = new Animation(
            (progress: number) => {
                this._currentTargetObjectRect = oldTarget.lerp(obj.target, progress)
                this.core!.render()
            },
            150,
            Curves.easeInOut,
            () => {
                this._targetAnimating = true
            },
            () => {
                this._targetAnimating = false
            }
        )
        moveTargetAnime.start()
    }

    public onPaint(ctx: CanvasRenderingContext2D): boolean {
        if (!this._resizing) return false
        ctx.setLineDash([5, 5])
        ctx.lineDashOffset = -this._resizingFrameElapsed / 2
        ctx.lineWidth = 2
        const target = this._currentTargetObjectRect
        const renderRect = this.core!.crd2posRect(target).float()
        const state = this._resizingLogicObjectState[0]
        ctx.strokeStyle = state ? this._okColor : this._noColor
        ctx.strokeRect(...renderRect.ltwh)
        ctx.setLineDash([])
        return true
    }
}