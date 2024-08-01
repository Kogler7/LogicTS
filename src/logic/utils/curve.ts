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

export interface Curve {
    transform(t: number): number
}

export class LinearCurve implements Curve {
    public transform(t: number) {
        return t
    }
}

export class CubicBezierCurve implements Curve {
    private _p1: number
    private _p2: number
    private _p3: number
    private _p4: number

    constructor(p1: number, p2: number, p3: number, p4: number) {
        this._p1 = p1
        this._p2 = p2
        this._p3 = p3
        this._p4 = p4
    }

    public evaluate(a: number, b: number, m: number) {
        return (
            3 * a * (1 - m) * (1 - m) * m + 3 * b * (1 - m) * m * m + m * m * m
        )
    }

    public transform(t: number) {
        let start = 0
        let end = 1
        while (true) {
            const mid = (start + end) / 2
            const x = this.evaluate(this._p1, this._p3, mid)
            if (Math.abs(x - t) < 0.001) {
                return this.evaluate(this._p2, this._p4, mid)
            } else if (x < t) {
                start = mid
            } else {
                end = mid
            }
        }
    }
}

export const Curves = {
    linear: new LinearCurve(),
    easeInOut: new CubicBezierCurve(0.42, 0, 0.58, 1),
    easeOut: new CubicBezierCurve(0, 0, 0.58, 1),
    easeIn: new CubicBezierCurve(0.42, 0, 1, 1),
    ease: new CubicBezierCurve(0.25, 0.1, 0.25, 1),
}
