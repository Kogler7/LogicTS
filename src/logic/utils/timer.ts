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