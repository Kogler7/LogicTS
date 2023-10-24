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

import LogicCore from "@/logic/core"
import LogicLayer from "@/logic/layer"
import IRenderable from "@/logic/mixins/renderable"

export default class CompLayer extends LogicLayer {
    private _comps: Set<IRenderable> = new Set()

    public onMounted(core: LogicCore): void {
        core.malloc('comps', this, { _comps: 1 })
    }

    public addComponent(comp: IRenderable): CompLayer {
        if (!this.core) {
            console.warn('Components should be added after the layer is mounted.')
        }
        this._comps.add(comp)
        return this
    }

    public onCache(ctx: CanvasRenderingContext2D): boolean {
        for (const comp of this._comps.values()) {
            comp.renderOn(ctx)
        }
        return true
    }
}