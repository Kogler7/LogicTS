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
* Created: Sep. 11, 2023
* Supported by: National Key Research and Development Program of China
*/

import { Point, Rect } from "@/logic/common/types2D"
import LogicCore from "../core"
import { IMovable } from "./movable"
import { IResizable } from "./resizable"


export interface IFlexible extends IMovable, IResizable {}

export class Flexible implements IFlexible {
    public id: number
    public core: LogicCore | null = null
    public rect: Rect
    public level: number
    public target: Rect = Rect.zero()
    public enabled: boolean = true
    public selected: boolean = false

    constructor(id: number, level: number, rect: Rect) {
        this.id = id
        this.level = level
        this.rect = rect
    }

    public onRegistered(core: LogicCore): void {
        core.setSelectable(this, true)
        core.setMovable(this, true)
        core.setResizable(this, true)
    }

    public onSelected(): void { }

    public onDeselected(): void { }

    public onMoveBegin(): void { }

    public onMoveEnd(): void { }

    public onMoving(oldPos: Point, newPos: Point): boolean {
        return false
    }

    public onResizeBegin(): void { }

    public onResizeEnd(): void { }

    public onResizing(oldRect: Rect, newRect: Rect): boolean {
        return false
    }
}