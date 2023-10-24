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
import { IHashable } from "@/logic/common/types"
import RenderPort, { PortAspect } from "./port"
import { uid } from "@/logic/common/uid"

export default class RenderNode implements IHashable {
    public id: uid
    public rect: Rect
    public name = ''
    public icon = ''
    public desc = ''
    public ports: Map<uid, RenderPort>

    constructor(id: uid, rect: Rect, ports: Array<RenderPort>, name = '', icon = '', desc = '') {
        this.id = id
        this.rect = rect
        this.name = name
        this.icon = icon
        this.desc = desc
        this.ports = new Map()
        for (const port of ports) {
            this.ports.set(port.id, port)
        }
    }

    get hash() {
        return this.id
    }

    public getPort(id: number): RenderPort {
        if (this.ports.has(id)) {
            return this.ports.get(id)!
        } else {
            throw new Error(`Port ${id} not found.`)
        }
    }

    public calcRelativePortPos(port: RenderPort, padding = 0): Point {
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

    public calcPortPos(port: RenderPort, padding = 0): Point {
        return Point.plus(this.rect.pos, this.calcRelativePortPos(port, padding))
    }
}