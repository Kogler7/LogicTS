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
import { Point } from "@/logic/common/types2D"
import { PortType } from "@/models/port"
import RenderPair from "@/models/pair"
import { uid } from "@/logic/common/uid"
import { Animation } from "@/logic/utils/anime"
import { Curves } from "@/logic/utils/curve"

export default class CompLayer extends LogicLayer {
    private _comps: Set<IRenderable> = new Set()
    private _portsArena: IObjectArena<Point> = new QueryPointArena()
    private _portPairMap: Map<number, RenderPair> = new Map()
    private _selectedPortId: uid | null = null
    private _selectedPair: RenderPair | null = null
    private _focusOpacity: number = 0
    private _focusAnime: Animation | null = null

    private _linking: boolean = false
    private _startPair: RenderPair | null = null
    private _acceptClick: boolean = true

    public onMounted(core: LogicCore): void {
        core.malloc('comps', this, {
            _comps: 1,
            _portsArena: 2,
            _portPairMap: 1,
        }, () => {
            this._selectedPortId = null
            this._selectedPair = null
            this._focusOpacity = 0
            this._focusAnime?.cancel()
            this._focusAnime = null
            this._acceptClick = true
            this._startPair = null
            this._linking = false
        })
        core.on('mousemove', this._onMouseMove.bind(this), 0)
        core.on('mousedown', this._onMouseDown.bind(this), 0)
        core.on('zoom.end', () => { this._updateArena() })
        core.on('memory.switch.after', () => { this._updateArena() })
        core.on('pan.end', () => { this._updateArena() })
        core.on('comp.move.finally', (compId: uid) => {
            const node = (core.getObject(compId) as Component).node
            for (const [id, port] of node.ports) {
                this._portsArena.setObject(id, node.calcPortPos(port))
            }
        })
        core.on('link.begin', (pair: RenderPair) => {
            this._linking = true
            this._startPair = pair
        })
        core.on('link.end', () => {
            this._linking = false
            this._startPair = null
            this._acceptClick = true
        })
        this._updateArena()
    }

    private _updateArena() {
        const core = this.core
        if (core) {
            this._portsArena.cropRect = core.logicRect
            this._portsArena.tolerance = 10 / core.logicWidth
        }
    }

    private _onHoverPort(portId: uid) {
        if (this._linking) {
            this._acceptClick = this._startPair?.compatibleWith(this._selectedPair!) || false
        } else {
            // only accept OUT port
            this._acceptClick = this._selectedPair?.typ === PortType.OUT
        }
        const opacity = this._focusOpacity
        const anime = new Animation(
            (t: number) => {
                this._focusOpacity = opacity + t * (1 - opacity)
                this.core?.render()
            },
            300,
            Curves.easeInOut
        )
        if (this._focusAnime) {
            this._focusAnime.cancel()
        }
        this._focusAnime = anime
        anime.start()
        this.core?.fire('pair.hover', this._portPairMap.get(portId)!)
    }

    private _onLeavePort(portId: uid) {
        const opacity = this._focusOpacity
        const anime = new Animation(
            (t: number) => {
                this._focusOpacity = opacity - t * opacity
                this.core?.render()
            },
            300,
            Curves.easeInOut
        )
        if (this._focusAnime) {
            this._focusAnime.cancel()
        }
        this._focusAnime = anime
        anime.start()
        this.core?.fire('pair.leave', this._portPairMap.get(portId)!)
    }

    private _onMouseMove(e: MouseEvent) {
        const pos = new Point(e.offsetX, e.offsetY)
        const crd = this.core?.pos2crd(pos)
        if (crd) {
            const portId = this._portsArena.posOccupied(crd)
            if (portId) {
                if (this._selectedPortId !== portId) {
                    this._selectedPortId = portId
                    this._selectedPair = this._portPairMap.get(portId)!
                    this._onHoverPort(portId)
                    this.core?.setCursor('pointer')
                }
            } else {
                if (this._selectedPortId) {
                    this._onLeavePort(this._selectedPortId)
                    this._selectedPortId = null
                    this.core?.popCursor('pointer')
                }
            }
        }
    }

    private _onMouseDown(e: MouseEvent) {
        if (this._selectedPortId) {
            this.core?.fire('pair.click', this._selectedPair!)
            return false // stop propagation
        }
    }

    public addComponent(comp: IRenderable): CompLayer {
        if (!this.core) {
            console.warn('Components should be added after the layer is mounted.')
        }
        this._comps.add(comp)
        // add ports to the arena
        if (comp instanceof Component) {
            this.core?.fire('node.add', comp.node)
            const node = comp.node
            for (const [id, port] of node.ports) {
                this._portsArena.addObject(id, node.calcPortPos(port))
                this._portPairMap.set(id, new RenderPair(node, port))
            }
        }
        return this
    }

    private _renderPorts(ctx: CanvasRenderingContext2D) {
        if (this.core!.logicWidth < 10) {
            return // too small to render
        }
        // render comp ports
        for (const [id, pair] of this._portPairMap) {
            const crd = pair.pos
            if (!this.core!.logicRect.containsPoint(crd)) {
                continue
            }
            const pos = this.core!.crd2pos(crd)
            if (pair.port.typ === PortType.OUT) {
                ctx.fillStyle = "#ff0000"
            } else {
                ctx.fillStyle = "#0000ff"
            }
            ctx.beginPath()
            ctx.arc(pos.x, pos.y, 4, 0, 2 * Math.PI)
            ctx.fill()
        }
    }

    public onCache(ctx: CanvasRenderingContext2D): boolean {
        for (const comp of this._comps.values()) {
            comp.renderOn(ctx)
        }
        this._renderPorts(ctx)
        return true
    }

    public onPaint(ctx: CanvasRenderingContext2D): boolean {
        // render focus circle
        if (this._selectedPair && this._focusOpacity > 0) {
            const core = this.core!
            const pos = core.crd2pos(this._selectedPair!.pos)
            const radius = 10
            const opacity = this._focusOpacity
            ctx.fillStyle = `rgba(${this._acceptClick ? 100 : 200
                }, ${this._acceptClick ? 200 : 0
                }, 0, ${opacity * 0.7})`
            ctx.beginPath()
            ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI)
            ctx.fill()
            this._renderPorts(ctx)
            return true
        }
        return false
    }
}