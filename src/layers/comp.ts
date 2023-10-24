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
import IObjectArena from "@/logic/arena/arena"
import QueryPointArena from "@/logic/arena/query-point"
import Component from "@/objects/comp"
import { Point, Rect, Size } from "@/logic/common/types2D"

export default class CompLayer extends LogicLayer {
    private _comps: Set<IRenderable> = new Set()
    private _portsArena: IObjectArena<Point> = new QueryPointArena()

    public onMounted(core: LogicCore): void {
        core.malloc('comps', this, { _comps: 1, _portsArena: 3 })
    }

    public addComponent(comp: IRenderable): CompLayer {
        if (!this.core) {
            console.warn('Components should be added after the layer is mounted.')
        }
        this._comps.add(comp)
        // add ports to the arena
        if (comp instanceof Component) {
            const node = comp.node
            for (const port of node.ports) {
                const rect = Rect.fromCenter(
                    node.calcPortPos(port),
                    new Size(10, 10)
                )
            }
        }
        return this
    }

    public onCache(ctx: CanvasRenderingContext2D): boolean {
        for (const comp of this._comps.values()) {
            comp.renderOn(ctx)
        }
        return true
    }
}