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
* Created: Sep. 24, 2023
* Supported by: National Key Research and Development Program of China
*/

import { uid, uid_rt } from "../common/uid"
import LogicCore from "../core"

export type Memory = Map<string, any>

function deepCopy(obj: any): any {
    let copy

    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj

    // Handle Date
    if (obj instanceof Date) {
        copy = new Date()
        copy.setTime(obj.getTime())
        return copy
    }

    // Handle Array
    if (obj instanceof Array) {
        copy = []
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = deepCopy(obj[i])
        }
        return copy
    }

    // Handle Map
    if (obj instanceof Map) {
        copy = new Map()
        for (const [key, value] of obj) {
            copy.set(key, deepCopy(value))
        }
        return copy
    }

    // Handle Set
    if (obj instanceof Set) {
        copy = new Set()
        for (const value of obj) {
            copy.add(deepCopy(value))
        }
        return copy
    }

    // Handle Object
    if (obj instanceof Object) {
        // copy = {}
        // for (var attr in obj) {
        //     // console.log(attr)
        //     if (obj.hasOwnProperty(attr)) (copy as any)[attr] = deepCopy(obj[attr])
        // }
        // return copy
        return Object.assign(Object.create(obj), obj)
    }

    throw new Error("Unable to copy obj! Its type isn't supported.")
}

export class MemoryHandler {
    private _core: LogicCore
    private _memories: Map<uid, Memory> = new Map()
    private _prototypes: Map<string, any> = new Map()
    private _currentMemory: Memory | null = null
    private _currentMemoryId: uid | null = null
    constructor(core: LogicCore) {
        this._core = core
        core.on('memory.switch.after.finally', () => {
            core.renderAll()
        })
    }

    get currentMemory(): Memory {
        if (!this._currentMemory) {
            this._currentMemoryId = this.createMemory()
            this._currentMemory = this._memories.get(this._currentMemoryId)!
        }
        return this._currentMemory
    }

    get currentMemoryId(): uid {
        if (!this._currentMemoryId) {
            this._currentMemoryId = this.createMemory()
            this._currentMemory = this._memories.get(this._currentMemoryId)!
        }
        return this._currentMemoryId
    }

    private _protoSet(name: string, proto: any) {
        if (this._prototypes.has(name)) {
            console.warn(`[MemoryHandler] Prototype "${name}" already exists.`)
        }
        this._prototypes.set(name, proto)
        for (const memory of this._memories.values()) {
            const copy = deepCopy(proto)
            memory.set(name, copy)
        }
    }

    public malloc(
        name: string,
        object: any,
        onBeforeSwitch: ((value: any) => void) | null = null,
        onAfterSwitch: ((value: any) => void) | null = null
    ): typeof Proxy {
        this._protoSet(name, object)
        if (onBeforeSwitch) {
            this._core.on('memory.switch.before', () => {
                const mem = this.currentMemory
                if (mem.has(name)) {
                    onBeforeSwitch(mem.get(name))
                } else {
                    onBeforeSwitch(null)
                }
            })
        }
        if (onAfterSwitch) {
            this._core.on('memory.switch.after', () => {
                const mem = this.currentMemory
                if (mem.has(name)) {
                    onAfterSwitch(mem.get(name))
                } else {
                    onAfterSwitch(null)
                }
            })
        }
        return new Proxy(object, {
            get: (_, prop, receiver) => {
                const object = this.currentMemory.get(name)
                return Reflect.get(object, prop, receiver)
            },
            set: (_, prop, value, receiver) => {
                const object = this.currentMemory.get(name)
                return Reflect.set(object, prop, value, receiver)
            }
        })
    }

    public free(name: string) {
        this._prototypes.delete(name)
        for (const memory of this._memories.values()) {
            memory.delete(name)
        }
    }

    public createMemory(): uid {
        const id = uid_rt()
        const object = new Map<string, any>()
        for (const [name, proto] of this._prototypes) {
            object.set(name, deepCopy(proto))
        }
        this._memories.set(id, object)
        this._core.fire('memory.create', id)
        return id
    }

    public switchMemory(id: uid) {
        if (!this._memories.has(id)) {
            console.error(`[MemoryHandler] Memory "${id}" does not exist.`)
            return
        }
        this._core.fire('memory.switch.before', id)
        this._currentMemoryId = id
        this._currentMemory = this._memories.get(id)!
        this._core.fire('memory.switch.after', id)
    }

    public deleteMemory(id: uid) {
        const success = this._memories.delete(id)
        if (success) {
            this._core.fire('memory.delete', id)
            // if the current memory is deleted, switch to another one
            if (id === this._currentMemoryId) {
                // if there is no memory left, create a new one
                if (this._memories.size === 0) {
                    const id = this.createMemory()
                    this.switchMemory(id)
                } else {
                    this.switchMemory(this._memories.keys().next().value)
                }
            }
        }
    }

    public switchMemoryToNext() {
        const keys = [...this._memories.keys()]
        if (keys.length === 0) {
            const id = this.createMemory()
            this.switchMemory(id)
        } else {
            let idx = keys.indexOf(this._currentMemoryId!)
            idx = (idx + 1) % keys.length
            this.switchMemory(keys[idx])
        }
    }
}