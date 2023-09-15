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
* Created: Jul. 21, 2023
* Supported by: National Key Research and Development Program of China
*/

export type hash = number | string

export interface IComparable {
    equals(obj: IComparable): boolean
}

export interface IHashable {
    get hash(): hash
}

export interface IOrderable {
    get order(): number
}

export interface IPrintable {
    get desc(): string
}

export interface IDisposable {
    dispose(): void
}

export enum HeapType {
    MIN,
    MAX
}

/**
 * This class is used to store unique objects.
 * It uses the equals method to determine whether two objects are equal.
 * It has the same effect as the Set class in ES6.
 */
export class EqualsSet<T extends IComparable>{
    private _set: Array<T>

    constructor(init: Array<T> = []) {
        this._set = init
    }

    add(obj: T): EqualsSet<T> {
        if (!this.has(obj)) {
            this._set.push(obj)
        }
        return this
    }

    has(obj: T): boolean {
        for (let i = 0; i < this._set.length; i++) {
            if (this._set[i].equals(obj)) {
                return true
            }
        }
        return false
    }

    delete(obj: T): boolean {
        for (let i = 0; i < this._set.length; i++) {
            if (this._set[i].equals(obj)) {
                this._set.splice(i, 1)
                return true
            }
        }
        return false
    }

    clear() {
        this._set = []
    }

    forEach(callback: (obj: T) => void) {
        this._set.forEach(callback)
    }

    get size() {
        return this._set.length
    }

    get set() {
        return this._set
    }
}

/**
 * This class is used to store unique keys and values.
 * It uses the equals method to determine whether two keys are equal.
 * It has the same effect as the Map class in ES6.
 */
export class EqualsMap<K extends IComparable, V>{
    private _map: Array<{ key: K, value: V }>

    constructor(init: Array<{ key: K, value: V }> = []) {
        this._map = init
    }

    set(key: K, value: V): EqualsMap<K, V> {
        if (!this.has(key)) {
            this._map.push({ key, value })
        }
        return this
    }

    get(key: K): V | null {
        for (let i = 0; i < this._map.length; i++) {
            if (this._map[i].key.equals(key)) {
                return this._map[i].value
            }
        }
        return null
    }

    has(key: K): boolean {
        for (let i = 0; i < this._map.length; i++) {
            if (this._map[i].key.equals(key)) {
                return true
            }
        }
        return false
    }

    delete(key: K): boolean {
        for (let i = 0; i < this._map.length; i++) {
            if (this._map[i].key.equals(key)) {
                this._map.splice(i, 1)
                return true
            }
        }
        return false
    }

    clear() {
        this._map = []
    }

    forEach(callback: (value: V, key: K) => void) {
        this._map.forEach(({ key, value }) => callback(value, key))
    }

    get size() {
        return this._map.length
    }

    get map(): Map<K, V> {
        return new Map(this._map.map(({ key, value }) => [key, value]))
    }
}

/**
 * This class is used to store unique objects.
 * It uses the hash method to determine whether two objects are equal.
 * It has the same effect as the Set class in ES6.
 */
export class HashSet<T extends IHashable>{
    private _set: Map<hash, T>

    constructor(init: Array<T> = []) {
        this._set = new Map(init.map(obj => [obj.hash, obj]))
    }

    add(obj: T): HashSet<T> {
        const h = obj.hash
        if (!this._set.has(h)) {
            this._set.set(h, obj)
        }
        return this
    }

    has(obj: T): boolean {
        return this._set.has(obj.hash)
    }

    get(hash: hash): T | null {
        return this._set.get(hash) || null
    }

    delete(obj: T): boolean {
        return this._set.delete(obj.hash)
    }

    clear() {
        this._set.clear()
    }

    forEach(callback: (obj: T) => void) {
        this._set.forEach(callback)
    }

    get size() {
        return this._set.size
    }

    get set() {
        return this._set
    }

    get array() {
        return Array.from(this._set.values())
    }
}

/**
 * This class is used to store unique keys and values.
 * It uses the hash method to determine whether two keys are equal.
 * It has the same effect as the Map class in ES6.
 */
export class HashMap<K extends IHashable, V>{
    private _vMap: Map<hash, V>
    private _kMap: Map<hash, K>

    constructor(init: Array<{ key: K, value: V }> = []) {
        this._vMap = new Map(init.map(({ key, value }) => [key.hash, value]))
        this._kMap = new Map(init.map(({ key }) => [key.hash, key]))
    }

    set(key: K, value: V): HashMap<K, V> {
        this._vMap.set(key.hash, value)
        this._kMap.set(key.hash, key)
        return this
    }

    get(key: K): V | null {
        return this._vMap.get(key.hash) ?? null
    }

    has(key: K): boolean {
        return this._vMap.has(key.hash)
    }

    delete(key: K) {
        this._kMap.delete(key.hash)
        this._vMap.delete(key.hash)
        return this
    }

    clear() {
        this._vMap.clear()
        this._kMap.clear()
    }

    forEach(callback: (value: V, key: K) => void) {
        this._vMap.forEach((value, hash) => {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            callback(value, this._kMap.get(hash)!)
        })
    }

    get size() {
        return this._vMap.size
    }

    get entries(): Array<{ key: K, value: V }> {
        return Array.from(this._vMap.entries()).map(([hash, value]) => {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            return { key: this._kMap.get(hash)!, value }
        })
    }

    get keys(): Array<K> {
        return Array.from(this._kMap.values())
    }

    get values() {
        return Array.from(this._vMap.values())
    }

    get uniqueValues() {
        return Array.from(new Set(this._vMap.values()))
    }
}

/**
 * This class is a binary heap, which is a complete binary tree.
 * It is used to store objects that implement the Orderable interface.
 * The heap can be used as a priority queue.
 */
export class BinaryHeap<T extends IOrderable>{
    private _type: HeapType
    private _heap: Array<T>

    constructor(init: Array<T> = [], type: HeapType = HeapType.MIN) {
        this._type = type
        this._heap = []
        init.forEach(obj => this.add(obj))
    }

    private _lessThan(a: T, b: T) {
        return this._type === HeapType.MIN ? a.order < b.order : a.order > b.order
    }

    private _heapifyUp(index: number) {
        const parent = Math.floor((index - 1) / 2)
        if (parent < 0) {
            return
        }
        if (this._lessThan(this._heap[index], this._heap[parent])) {
            const temp = this._heap[index]
            this._heap[index] = this._heap[parent]
            this._heap[parent] = temp
            this._heapifyUp(parent)
        }
    }

    private _heapifyDown(index: number) {
        const left = index * 2 + 1
        if (left >= this._heap.length) {
            return
        }
        let min = index
        if (this._lessThan(this._heap[left], this._heap[min])) {
            min = left
        }
        const right = index * 2 + 2
        if (right < this._heap.length && this._lessThan(this._heap[right], this._heap[min])) {
            min = right
        }
        if (min !== index) {
            const temp = this._heap[index]
            this._heap[index] = this._heap[min]
            this._heap[min] = temp
            this._heapifyDown(min)
        }
    }

    get size() {
        return this._heap.length
    }

    public add(obj: T): BinaryHeap<T> {
        this._heap.push(obj)
        this._heapifyUp(this._heap.length - 1)
        return this
    }

    public pop(): T | null {
        if (this._heap.length === 0) {
            return null
        }
        const top = this._heap[0]
        if (this._heap.length > 1) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this._heap[0] = this._heap.pop()!
            this._heapifyDown(0)
        } else {
            this._heap.pop()
        }
        return top
    }

    public peek(): T | null {
        return this._heap[0] ?? null
    }
}

/**
 * This class is a priority queue.
 * It is used to store objects that implement the Orderable interface.
 * The queue is implemented using a binary heap.
 */
export class PriorityQueue<T extends IOrderable> extends BinaryHeap<T>{
    get empty() {
        return this.size === 0
    }

    public enqueue(obj: T): PriorityQueue<T> {
        this.add(obj)
        return this
    }

    public dequeue(): T | null {
        return this.pop()
    }
}

export class TrapSet<T> {
    private _set: Set<T>
    private _onAdded: (obj: T) => void
    private _onDelete: (obj: T) => void
    private _onChanged: (delta: number) => void

    constructor(
        onAdded: (obj: T) => void,
        onDelete: (obj: T) => void,
        onChanged: (delta: number) => void = () => { },
        init: Array<T> = []
    ) {
        this._set = new Set(init)
        this._onAdded = onAdded
        this._onDelete = onDelete
        this._onChanged = onChanged
    }

    add(obj: T): TrapSet<T> {
        if (!this.has(obj)) {
            this._set.add(obj)
            this._onAdded(obj)
            this._onChanged(1)
        }
        return this
    }

    has(obj: T): boolean {
        return this._set.has(obj)
    }

    delete(obj: T): boolean {
        if (this._set.delete(obj)) {
            this._onDelete(obj)
            this._onChanged(-1)
            return true
        }
        return false
    }

    clear(except: T | null = null) {
        const oldSize = this._set.size
        for (const obj of this._set) {
            if (obj !== except) {
                this._set.delete(obj)
                this._onDelete(obj)
            }
        }
        const newSize = this._set.size
        if (newSize !== oldSize) {
            this._onChanged(newSize - oldSize)
        }
    }

    forEach(callback: (obj: T) => void) {
        this._set.forEach(callback)
    }

    get size() {
        return this._set.size
    }

    get set() {
        return this._set
    }
}