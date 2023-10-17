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
* Created: Oct. 13, 2023
* Supported by: National Key Research and Development Program of China
*/

import { Point, Rect } from "@/logic/common/types2D"
import { IHashable, IComparable } from "@/logic/common/types"
import { uid } from "@/logic/common/uid"

export enum RenderPortDirection {
    IN = 0,
    OUT = 1
}

export enum RenderPortAspect {
    LEFT = 0,
    RIGHT = 1,
    TOP = 2,
    BOTTOM = 3
}

export class RenderPort implements IComparable {
    public id: number
    // port type, in or out
    public dir: RenderPortDirection
    // port location, indicate the logical bias of the port
    // from the top-left point of the element node
    public loc: number
    // which aspect is the port located at
    public aspect: RenderPortAspect
    public connected = false

    constructor(
        dir: RenderPortDirection,
        loc: number,
        aspect: RenderPortAspect,
        id: number,
        connected = false
    ) {
        if (loc < 0 || loc > 10) {
            throw new Error('loc must be between 0 and 10')
        }
        this.id = id
        this.dir = dir
        this.loc = loc
        this.aspect = aspect
        this.connected = connected
    }

    equals(other: RenderPort) {
        return this.dir === other.dir &&
            this.loc === other.loc &&
            this.aspect === other.aspect
    }

    static fromObject(obj: any) {
        // return new RenderPort(
        //     parseInt(obj.direction) as RenderPortDirection,
        //     parseInt(obj.location),
        //     parseInt(obj.aspect) as RenderPortAspect,
        //     uuidFromBytes(obj.portId) as uid,
        // )
    }
}

export class RenderNode implements IHashable {
    public id: uid
    public rect: Rect
    public grid: number
    public selected: boolean
    public iconName = ''
    public name = ''
    public description = ''
    public ports: Array<RenderPort>

    constructor(id: uid, rect: Rect, ports: Array<RenderPort>, icon = '', name = '', description = '') {
        this.id = id
        this.rect = rect
        this.grid = 15
        this.selected = false
        this.iconName = icon
        this.name = name
        this.description = description
        this.ports = ports
    }

    get hash() {
        return this.id
    }

    public getPort(id: number): RenderPort {
        if (id < 0 || id >= this.ports.length) {
            throw new Error('invalid port id')
        }
        return this.ports[id]
    }

    public calcPortRelativeLoc(port: RenderPort, padding = 0): Point {
        const { width, height } = this.rect.size
        const { loc, aspect } = port
        const offset = loc * this.grid
        if (aspect === RenderPortAspect.LEFT)
            return new Point(-padding, offset)
        if (aspect === RenderPortAspect.RIGHT)
            return new Point(width + padding, offset)
        if (aspect === RenderPortAspect.TOP)
            return new Point(offset, -padding)
        if (aspect === RenderPortAspect.BOTTOM)
            return new Point(offset, height + padding)
        return Point.zero()
    }

    public calcPortLoc(port: RenderPort, padding = 0): Point {
        return this.rect.pos.plus(this.calcPortRelativeLoc(port, padding))
    }
}

export class RenderPair implements IHashable, IComparable {
    public node: RenderNode
    public port: RenderPort
    private portEl: HTMLElement | null = null

    constructor(node: RenderNode, port: RenderPort) {
        this.node = node
        this.port = port
    }

    public get portId() {
        return this.port.id
    }

    public get nodeId() {
        return this.node.id
    }

    public location(padding = 0): Point {
        return this.node.calcPortLoc(this.port, padding)
    }

    public relativeLoc(padding = 0): Point {
        return this.node.calcPortRelativeLoc(this.port, padding)
    }

    public compatible(other: RenderPair): boolean {
        return this.nodeId !== other.nodeId && this.dir !== other.dir
    }

    public equals(other: RenderPair): boolean {
        return this.nodeId === other.nodeId && this.port.equals(other.port)
    }

    set portElement(el: HTMLElement | null) {
        this.portEl = el
        this.connected = this.port.connected
    }

    set connected(connected: boolean) {
        this.port.connected = connected
        if (this.portEl) {
            this.portEl.setAttribute('connected', connected.toString())
            this.portEl.style.opacity = connected ? '0' : '1'
        }
    }

    get hash() {
        return `${this.node.id}:${this.port.dir}:${this.port.loc}:${this.port.aspect}`
    }

    get dir() {
        return this.port.dir
    }

    get loc() {
        return this.port.loc
    }

    get aspect() {
        return this.port.aspect
    }
}