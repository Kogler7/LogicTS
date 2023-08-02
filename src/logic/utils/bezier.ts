export class CubicBezier {
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
        return 3 * a * (1 - m) * (1 - m) * m + 3 * b * (1 - m) * m * m + m * m * m
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

export const BezierCurves = {
    easeInOut: new CubicBezier(0.42, 0, 0.58, 1),
    easeOut: new CubicBezier(0, 0, 0.58, 1),
    easeIn: new CubicBezier(0.42, 0, 1, 1),
    ease: new CubicBezier(0.25, 0.1, 0.25, 1),
    linear: new CubicBezier(0, 0, 1, 1)
}