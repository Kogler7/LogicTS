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
import { IObject } from "../handlers/object"

export interface ISelectable extends IObject {
    enabled: boolean
    selected: boolean
    onSelected(): void
    onDeselected(): void
}

export class Selectable implements ISelectable {
    public id: number
    public core: LogicCore | null = null
    public rect: Rect
    public level: number
    public enabled: boolean = true
    public selected: boolean = false

    constructor(id: number, level: number, rect: Rect) {
        this.id = id
        this.level = level
        this.rect = rect
    }

    public onRegistered(core: LogicCore): void {
        core.setSelectable(this, true)
    }

    public onSelected(): void {
        // TODO
    }

    public onDeselected(): void {
        // TODO
    }
}