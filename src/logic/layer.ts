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
* Created: Jul. 20, 2023
* Supported by: National Key Research and Development Program of China
*/

import LogicCore from './core';

export default class LogicLayer {
    protected core?: LogicCore
    public name: string
    public level: number = 0
    public visible: boolean = true

    constructor(name: string, level: number = 0, visible: boolean = true) {
        this.name = name
        this.level = level
        this.visible = visible
    }

    public _onMount(core: LogicCore) {
        this.core = core
        this.onMount(core)
    }

    public onMount(core: LogicCore) { }

    public onUnmount() { }

    public onReloc(ctx: CanvasRenderingContext2D): boolean {
        return false
    }

    public onPaint(ctx: CanvasRenderingContext2D): boolean {
        return false
    }
}