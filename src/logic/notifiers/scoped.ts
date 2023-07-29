export default class ScopedEventNotifier {
    private _children: Map<string, ScopedEventNotifier> = new Map()
    private _callbacks: Function[] = []

    public on(event: string, callback: Function) {
        if (event.length === 0) {
            this._callbacks.push(callback)
            return
        }
        const idx = event.indexOf('.')
        let first: string
        if (idx < 0) {
            first = event
            event = ''
        } else {
            first = event.substring(0, idx)
            event = event.substring(idx + 1)
        }
        let child = this._children.get(first)
        if (!child) {
            child = new ScopedEventNotifier()
            this._children.set(first, child)
        }
        child.on(event, callback)
    }

    public off(event: string, callback: Function) {
        if (event.length === 0) {
            const idx = this._callbacks.indexOf(callback)
            if (idx >= 0) {
                this._callbacks.splice(idx, 1)
            }
            return
        }
        const idx = event.indexOf('.')
        let first: string
        if (idx < 0) {
            first = event
            event = ''
        } else {
            first = event.substring(0, idx)
            event = event.substring(idx + 1)
        }
        const child = this._children.get(first)
        if (child) {
            child.off(event, callback)
        }
    }

    public fire(event: string, ...args: any[]): boolean {
        for (const callback of this._callbacks) {
            const res = callback(...args)
            if (res === false) {
                return false
            }
        }
        const idx = event.indexOf('.')
        let first: string
        if (idx < 0) {
            first = event
            event = ''
        } else {
            first = event.substring(0, idx)
            event = event.substring(idx + 1)
        }
        const child = this._children.get(first)
        if (child) {
            return child.fire(event, ...args)
        }
        return true
    }
}