import { Curve, Curves } from "./curve"

export { Curves }

export class Animation {
    private _callback: Function
    private _duration: number
    private _curve: Curve
    private _onStart: Function | null = null
    private _onEnd: Function | null = null

    private _startTime: number = 0
    private _endTime: number = 0

    constructor(
        callback: Function,
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
        requestAnimationFrame(() => { this._update() })
    }

    private _update() {
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