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

import LogicCore from "../core"

export default class CursorHandler {
    private _targetEl: HTMLElement | null = null
    private _cursorStack: string[] = []

    constructor(core: LogicCore) {
        core.malloc('__cursor__', {
            stack: []
        }, (value: any) => {
            value.stack = this._cursorStack
        }, (value: any) => {
            this._cursorStack = value.stack
        })
    }

    public connect(el: HTMLElement) {
        this._targetEl = el
    }

    public get cursorStack() {
        return this._cursorStack
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