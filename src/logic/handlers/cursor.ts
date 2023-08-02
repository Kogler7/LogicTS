export default class CursorHandler {
    private _targetEl: HTMLElement | null = null
    private _cursorStack: string[] = []

    public bind(el: HTMLElement) {
        this._targetEl = el
    }

    private get _top() {
        if (this._cursorStack.length > 0) {
            return this._cursorStack[this._cursorStack.length - 1]
        }
        return 'default'
    }

    private set _top(cursor: string) {
        if (this._cursorStack.length > 0) {
            this._cursorStack[this._cursorStack.length - 1] = cursor
        }
    }

    private _update() {
        if (!this._targetEl) {
            return
        }
        this._targetEl.style.cursor = this._top
    }

    public push(cursor: string) {
        if (this._top === cursor) {
            return
        }
        this._cursorStack.push(cursor)
        this._update()
    }

    public recall(cursor: string) {
        for (let i = this._cursorStack.length - 1; i >= 0; i--) {
            if (this._cursorStack[i] === cursor) {
                this._cursorStack.splice(i, 1)
                this._update()
                return
            }
        }
    }

    public set(cursor: string) {
        this._top = cursor
        this._update()
    }

    public pop() {
        if (this._cursorStack.length > 0) {
            this._cursorStack.pop()
            this._update()
        }
    }
}