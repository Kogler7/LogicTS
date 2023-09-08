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
* Created: Aug. 3, 2023
* Supported by: National Key Research and Development Program of China
*/

import { Curve, Curves } from "./curve"

export { Curves }

export class Animation {
    private _callback: (progress: number) => void
    private _duration: number
    private _curve: Curve
    private _onStart: Function | null = null
    private _onEnd: Function | null = null

    private _startTime: number = 0
    private _endTime: number = 0

    private cancelled: boolean = false

    constructor(
        callback: (progress: number) => void,
        duration: number = 1000,
        curve: Curve = Curves.linear,
        onStart: Function | null = null,
        onEnd: Function | null = null
    ) {
        this._callback = callback
        this._duration = duration
        this._curve = curve
        this._onStart = onStart
        this._onEnd = onEnd
    }

    public start() {
        this._startTime = Date.now()
        this._endTime = this._startTime + this._duration
        if (this._onStart) {
            this._onStart()
        }
        this._callback(0)
        requestAnimationFrame((() => { this._update() }).bind(this))
    }

    public cancel(terminate: boolean = false) {
        this.cancelled = true
        if (terminate) {
            this._callback(1)
            if (this._onEnd) {
                this._onEnd()
            }
        }
    }

    private _update() {
        if (this.cancelled) return
        const time = Date.now()
        if (time >= this._endTime) {
            this._callback(1)
            if (this._onEnd) {
                this._onEnd()
            }
            return
        }
        this._callback(
            this._curve.transform((time - this._startTime) / this._duration)
        )
        requestAnimationFrame(() => { this._update() })
    }
}