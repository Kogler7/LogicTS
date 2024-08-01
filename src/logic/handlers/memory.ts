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

import { uid, uid_chk, uid_rt } from '../common/uid'
import { deepCopy } from '../utils/copy'
import LogicCore from '../core'

export type Memory = Map<string, any>
export type MemoryDescriptor = { [key: string]: number }
export type MemoryPrototype = { target: any; descriptor: MemoryDescriptor }

export class MemoryHandler {
    private _core: LogicCore
    private _defaults: Memory = new Map()
    private _currentMemory: Memory = new Map()
    private _currentMemoryId: uid = 0
    private _memories: Map<uid, Memory> = new Map([
        [this._currentMemoryId, this._currentMemory],
    ])
    private _prototypes: Map<string, MemoryPrototype> = new Map()
    constructor(core: LogicCore) {
        this._core = core
        core.on('memory.switch.after.finally', () => {
            core.renderAll()
        })
    }

    get currentMemory(): Memory {
        return this._currentMemory
    }

    get currentMemoryId(): uid {
        return this._currentMemoryId
    }

    private _cloneDataByProto(
        name: string,
        srcMem: Memory,
        proto: MemoryPrototype,
    ): any {
        const entry = srcMem.get(name)
        if (!entry) {
            throw new Error(`[MemoryHandler] Memory "${name}" does not exist.`)
        }
        const data: any = {}
        for (const [key, depth] of Object.entries(proto.descriptor)) {
            data[key] = deepCopy(entry[key], depth)
        }
        return data
    }

    private _fetchDataByProto(proto: MemoryPrototype, copy: boolean): any {
        const { target, descriptor } = proto
        const data: any = {}
        for (const [key, depth] of Object.entries(descriptor)) {
            data[key] = copy ? deepCopy(target[key], depth) : target[key]
        }
        return data
    }

    private _forceSyncByProto(proto: MemoryPrototype, data: any) {
        const { target, descriptor } = proto
        for (const [key, _] of Object.entries(descriptor)) {
            target[key] = data[key]
        }
    }

    private _protoAdd(name: string, proto: MemoryPrototype) {
        if (this._prototypes.has(name)) {
            console.warn(`[MemoryHandler] Prototype "${name}" already exists.`)
        }
        this._prototypes.set(name, proto)
        // first, set the target data to the current memory without copying
        this._currentMemory.set(name, this._fetchDataByProto(proto, false))
        // then, copy the target data to the memory defaults for copying
        this._defaults.set(name, this._fetchDataByProto(proto, true))
        // finally, copy the default data to all the other memories
        for (const [id, memory] of this._memories) {
            if (id === this._currentMemoryId) continue
            memory.set(
                name,
                this._cloneDataByProto(name, this._defaults, proto),
            )
        }
    }

    public malloc(
        name: string,
        target: any,
        descriptor: MemoryDescriptor,
        onBeforeSwitch: ((value: any) => void) | null = null,
        onAfterSwitch: ((value: any) => void) | null = null,
    ) {
        this._protoAdd(name, { target, descriptor })
        this._core.on('memory.switch.before', (id: uid) => {
            if (!this._prototypes.has(name)) {
                return
            } // save the current memory
            this._currentMemory.set(
                name,
                this._fetchDataByProto(this._prototypes.get(name)!, false),
            )
            if (onBeforeSwitch) {
                onBeforeSwitch(id)
            }
        })
        this._core.on('memory.switch.after', (id: uid) => {
            if (!this._prototypes.has(name)) {
                return
            }
            // load the new memory
            this._forceSyncByProto(
                this._prototypes.get(name)!,
                this._memories.get(id)!.get(name),
            )
            if (onAfterSwitch) {
                onAfterSwitch(id)
            }
        })
    }

    public free(name: string) {
        this._prototypes.delete(name)
        for (const memory of this._memories.values()) {
            memory.delete(name)
        }
    }

    public createMemory(memId?: uid): uid {
        if (memId && !uid_chk(memId)) {
            console.error(
                `[MemoryHandler] Cannot create memory "${memId}" because it is not a valid uid.`,
            )
            return this._currentMemoryId
        }
        const id = memId ?? uid_rt()
        console.log(`[MemoryHandler] Creating a new memory "${id}".`)
        const memory = new Map<string, any>()
        for (const [name, proto] of this._prototypes) {
            memory.set(
                name,
                this._cloneDataByProto(name, this._defaults, proto),
            )
        }
        this._memories.set(id, memory)
        return id
    }

    public switchMemory(id: uid) {
        if (!this._memories.has(id)) {
            console.error(`[MemoryHandler] Memory "${id}" does not exist.`)
            return this._currentMemoryId
        }
        this._core.fire('memory.switch.before', this._currentMemoryId)
        this._currentMemoryId = id
        this._currentMemory = this._memories.get(id)!
        this._core.fire('memory.switch.after', id)
        console.group(`[MemoryHandler] Switched to memory "${id}".`)
        console.log(this._memories.get(id))
        console.groupEnd()
        return id
    }

    public deleteMemory(id: uid) {
        if (id === 0) return
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

    public getMemoryById(id: uid): Memory {
        if (!this._memories.has(id)) {
            throw new Error(`[MemoryHandler] Memory "${id}" does not exist.`)
        }
        return this._memories.get(id)!
    }

    public switchMemoryToNext() {
        const keys = [...this._memories.keys()]
        let targetId: uid
        if (keys.length === 0) {
            targetId = this.createMemory()
        } else {
            let idx = keys.indexOf(this._currentMemoryId!)
            idx = (idx + 1) % keys.length
            targetId = keys[idx]
            if (targetId === 0) {
                idx = (idx + 1) % keys.length
                targetId = keys[idx]
            }
        }
        return this.switchMemory(targetId)
    }
}
