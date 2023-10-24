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
import RenderPort from "@/models/port"
import RenderPair from "@/models/pair"
import { uid } from "@/logic/common/uid"

export default class CompLayer extends LogicLayer {
    private _comps: Set<IRenderable> = new Set()
    private _portsArena: IObjectArena<Point> = new QueryPointArena()
    private _portPairMap: Map<number, RenderPair> = new Map()
    private _selectedPortId: uid | null = null

    public onMounted(core: LogicCore): void {
        core.malloc('comps', this, { _comps: 1, _portsArena: 2, _portPairMap: 1 })
        core.on('mousemove', this._onMouseMove.bind(this), 0)
        core.on('zoom.end', () => {
            this._portsArena.cropRect = core.logicRect
            this._portsArena.tolerance = 10 / core.logicWidth
        })
        core.on('memory.switch.after', () => {
            this._portsArena.cropRect = core.logicRect
            this._portsArena.tolerance = 10 / core.logicWidth
        })
        this._portsArena.cropRect = core.logicRect
        this._portsArena.tolerance = 10 / core.logicWidth
    }

    private _onMouseMove(e: MouseEvent) {
        const pos = new Point(e.offsetX, e.offsetY)
        const crd = this.core?.pos2crd(pos)
        if (crd) {
            const portId = this._portsArena.posOccupied(crd)
            if (portId) {
                console.log(portId)
                this.core?.setCursor('pointer')
            } else {
                this.core?.popCursor('pointer')
            }
        }
    }

    public addComponent(comp: IRenderable): CompLayer {
        if (!this.core) {
            console.warn('Components should be added after the layer is mounted.')
        }
        this._comps.add(comp)
        // add ports to the arena
        if (comp instanceof Component) {
            const node = comp.node
            for (const [id, port] of node.ports) {
                this._portsArena.addObject(id, node.calcPortPos(port))
                this._portPairMap.set(id, new RenderPair(node, port))
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