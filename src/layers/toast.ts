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
* Created: Oct. 15, 2023
* Supported by: National Key Research and Development Program of China
*/

import LogicLayer from "../logic/layer"
import Toast, { ToastBaseline } from "@/logic/utils/toast"
import LogicCore from "@/logic/core"
import { Point } from "@/logic/common/types2D"

export default class ToastLayer extends LogicLayer {
    private _toast: Toast | null = null

    private _calcAnchor(): Point {
        // return new Point(this.core!.stageWidth / 2, this.core!.stageHeight - 40)
        return new Point(this.core!.stageWidth - 40, this.core!.stageHeight - 40)
    }

    public onMounted(core: LogicCore): void {
        this._toast = new Toast(
            core,
            this._calcAnchor(),
        )
        this._toast.baseline = ToastBaseline.RIGHT
        this._toast.style = {
            size: 18,
            family: 'Arial',
            style: 'normal',
            color: '#757575',
        }
        core.on('stage.resize', () => {
            if (this._toast) {
                this._toast.anchor = this._calcAnchor()
            }
        })
        core.on('toast.show', (text: string, duration: number = 300) => {
            if (this._toast) {
                this._toast.anchor = this._calcAnchor()
            }
            this._toast?.show(text, duration)
        })
    }

    public onPaint(ctx: CanvasRenderingContext2D): boolean {
        if (this._toast) {
            this._toast.renderOn(ctx)
            return true
        }
        return false
    }
}