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
* Created: Aug. 3, 2023
* Supported by: National Key Research and Development Program of China
*/

import { Rect } from "../common/types2D"
import LogicCore from "../core"
import { ISelectable } from "./selectable"

export interface IResizable extends ISelectable {
    rect: Rect
    target: Rect
    onResizing(oldRect: Rect, newRect: Rect): boolean
    onResizeBegin(): void
    onResizeEnd(): void
}

export class Resizable implements IResizable {
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
        core.setResizable(this, true)
    }

    public onSelected(): void { }

    public onDeselected(): void { }

    public onResizeBegin(): void { }

    public onResizeEnd(): void { }

    public onResizing(oldRect: Rect, newRect: Rect): boolean {
        return false
    }
}