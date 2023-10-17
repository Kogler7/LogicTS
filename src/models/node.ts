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

export enum PortType {
    IN = 0,
    OUT = 1
}

export enum PortAspect {
    LEFT = 0,
    RIGHT = 1,
    TOP = 2,
    BOTTOM = 3
}

export class RenderPort implements IComparable {
    public id: number
    // port location, indicate the logical bias of the port
    // from the top-left point of the element node
    public loc: number
    // port type, in or out
    public typ: PortType
    // which aspect is the port located at
    public asp: PortAspect
    public connected = false

    constructor(
        id: number,
        loc: number,
        typ: PortType,
        asp: PortAspect,
        connected = false
    ) {
        this.id = id
        this.loc = loc
        this.typ = typ
        this.asp = asp
        this.connected = connected
    }

    equals(other: RenderPort) {
        return this.typ === other.typ &&
            this.loc === other.loc &&
            this.asp === other.asp
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
    public name = ''
    public icon = ''
    public desc = ''
    public ports: Array<RenderPort>

    constructor(id: uid, rect: Rect, ports: Array<RenderPort>, name = '', icon = '', desc = '') {
        this.id = id
        this.rect = rect
        this.name = name
        this.icon = icon
        this.desc = desc
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

    public calcRelativePortLoc(port: RenderPort, padding = 0): Point {
        const { width, height } = this.rect.size
        const { loc, asp } = port
        if (asp === PortAspect.LEFT)
            return new Point(-padding, loc)
        if (asp === PortAspect.RIGHT)
            return new Point(width + padding, loc)
        if (asp === PortAspect.TOP)
            return new Point(loc, -padding)
        if (asp === PortAspect.BOTTOM)
            return new Point(loc, height + padding)
        return Point.zero()
    }

    public calcPortLoc(port: RenderPort, padding = 0): Point {
        return Point.plus(this.rect.pos, this.calcRelativePortLoc(port, padding))
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
        return this.node.calcRelativePortLoc(this.port, padding)
    }

    public compatible(other: RenderPair): boolean {
        return this.nodeId !== other.nodeId && this.typ !== other.typ
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
        return `${this.node.id}:${this.port.typ}:${this.port.loc}:${this.port.asp}`
    }

    get loc() {
        return this.port.loc
    }

    get typ() {
        return this.port.typ
    }

    get asp() {
        return this.port.asp
    }
}