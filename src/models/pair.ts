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
* Created: Oct. 24, 2023
* Supported by: National Key Research and Development Program of China
*/

import { Point } from "@/logic/common/types2D"
import { IHashable, IComparable } from "@/logic/common/types"
import RenderNode from "./node"
import RenderPort from "./port"

export default class RenderPair implements IHashable, IComparable {
    public node: RenderNode
    public port: RenderPort

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

    public position(padding = 0): Point {
        return this.node.calcPortPos(this.port, padding)
    }

    public relativePos(padding = 0): Point {
        return this.node.calcRelativePortPos(this.port, padding)
    }

    public compatibleWith(other: RenderPair): boolean {
        return this.nodeId !== other.nodeId && this.typ !== other.typ
    }

    public equals(other: RenderPair): boolean {
        return this.nodeId === other.nodeId && this.port.equals(other.port)
    }

    set connected(connected: boolean) {
        this.port.connected = connected
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

    get dir() {
        return this.port.dir
    }

    get pos() {
        return this.position(0)
    }
}