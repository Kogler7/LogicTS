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