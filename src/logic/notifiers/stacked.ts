interface StackedEventCallback {
    level: number
    callback: Function
}

export default class StackedEventNotifier {
    private _callbacks: Map<string, StackedEventCallback[]> = new Map()

    public on(event: string, callback: Function, level: number = 0) {
        let callbacks = this._callbacks.get(event)
        if (!callbacks) {
            callbacks = []
            this._callbacks.set(event, callbacks)
        }
        callbacks.push({ level, callback })
        // sort by level in descending order
        callbacks.sort((a, b) => b.level - a.level)
    }

    public off(event: string, callback: Function | null = null, level = 0) {
        const callbacks = this._callbacks.get(event)
        if (!callbacks) {
            return
        }
        const idx = callback !== null ?
            callbacks.findIndex(item => item.callback === callback) :
            callbacks.findIndex(item => item.level === level)
        if (idx >= 0) {
            callbacks.splice(idx, 1)
        }
    }

    public emit(event: string, ...args: any[]): boolean {
        const callbacks = this._callbacks.get(event)
        if (!callbacks) {
            return true
        }
        for (const callback of callbacks) {
            const res = callback.callback(...args)
            if (res === false) {
                return false
            }
        }
        return true
    }
}