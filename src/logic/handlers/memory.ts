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
import { deepCopy } from "../utils/copy"
import LogicCore from "../core"

export type Memory = Map<string, any>

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
        this._currentMemoryId = this.createMemory()
        this._currentMemory = this._memories.get(this._currentMemoryId)!
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
        object.id = uid_rt()
        console.log(object)
        console.log(`[MemoryHandler] Malloc "${name}" with id "${object.id}".`)
        this._protoSet(name, object)
        if (onBeforeSwitch) {
            this._core.on('memory.switch.before', (id: uid) => {
                const mem = this._memories.get(id)!
                if (mem.has(name)) {
                    onBeforeSwitch(mem.get(name))
                } else {
                    onBeforeSwitch(null)
                }
            })
        }
        if (onAfterSwitch) {
            this._core.on('memory.switch.after', (id: uid) => {
                const mem = this._memories.get(id)!
                if (mem.has(name)) {
                    onAfterSwitch(mem.get(name))
                } else {
                    onAfterSwitch(null)
                }
            })
        }
        return new Proxy(this.currentMemory.get(name)!, {
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
        console.log(`[MemoryHandler] Creating a new memory.`)
        const id = uid_rt()
        const object = new Map<string, any>()
        for (const [name, proto] of this._prototypes) {
            console.log(`[MemoryHandler] Copying "${name}" in memory "${id}", ${proto}.`)
            // debugger
            object.set(name, deepCopy(proto))
            object.get(name).id = id
        }
        this._memories.set(id, object)
        return id
    }

    public switchMemory(id: uid) {
        if (!this._memories.has(id)) {
            console.error(`[MemoryHandler] Memory "${id}" does not exist.`)
            return
        }
        this._core.fire('memory.switch.before', this._currentMemoryId)
        this._currentMemoryId = id
        this._currentMemory = this._memories.get(id)!
        this._core.fire('memory.switch.after', id)
        console.log(`[MemoryHandler] Switched to memory "${id}".`)
        for (const memo of this._memories.values()) {
            console.log(memo)
        }
    }

    public deleteMemory(id: uid) {
        const success = this._memories.delete(id)
        if (success) {
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