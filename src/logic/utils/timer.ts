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
    private _callback: Function
    private _initial: number
    private _interval: number

    constructor(callback: Function, initial: number = 24, interval: number = 16.7) {
        this._callback = callback
        this._initial = initial
        this._interval = interval
        this._count = initial
        setTimeout(() => {
            this._update()
        }, interval)
    }

    private _update() {
        this._count -= 1
        if (this._count <= 0) {
            this._callback()
        } else {
            setTimeout(() => {
                this._update()
            }, this._interval)
        }
    }

    public reset() {
        this._count = this._initial
    }
}