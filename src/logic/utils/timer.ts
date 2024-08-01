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
 * Created: Jul. 29, 2023
 * Supported by: National Key Research and Development Program of China
 */

export default class Timer {
    private _count: number
    private _initial: number
    private _interval: number
    private _finished: boolean = true
    private _onFinished: Function
    private _onStep: Function | null = null

    public get finished(): boolean {
        return this._finished
    }

    public get progress(): number {
        return (this._initial - this._count) / this._initial
    }

    constructor(
        onFinished: Function,
        initial: number = 30,
        interval: number = 10,
        onStep: Function | null = null,
    ) {
        this._initial = initial
        this._interval = interval
        this._count = this._initial
        this._onFinished = onFinished
        this._onStep = onStep
    }

    private _update() {
        this._count -= 1
        if (this._onStep) {
            this._onStep()
        }
        if (this._count <= 0) {
            this._finished = true
            this._onFinished()
        } else {
            setTimeout(() => {
                this._update()
            }, this._interval)
        }
    }

    public start() {
        if (this._finished) {
            this._finished = false
            if (this._onStep) {
                this._onStep()
            }
            setTimeout(() => {
                this._update()
            }, this._interval)
        }
    }

    public cancel() {
        this._count = 0
    }

    public reset(
        initial: number | null = null,
        interval: number | null = null,
    ): Timer {
        if (initial !== null) {
            this._initial = initial
        }
        if (interval !== null) {
            this._interval = interval
        }
        this._count = this._initial
        return this
    }
}
