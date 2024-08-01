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

import { HashMap } from '@/logic/common/types'
import { uid, uid_rt } from '@/logic/common/uid'
import RenderNode from './node'
import RenderPair from './pair'
import RenderLink from './link'
import RenderPath from './path'
import { PortType } from './port'
import { Point } from '@/logic/common/types2D'

type node_id = uid
type link_id = uid

export default class RenderGraph {
    private _id: uid
    private _graph: HashMap<RenderPair, Set<link_id>>
    private _nodes: Map<node_id, RenderNode>
    private _links: Map<link_id, RenderLink>
    private _paths: Map<link_id, RenderPath>

    constructor() {
        this._id = uid_rt()
        this._graph = new HashMap()
        this._nodes = new Map()
        this._links = new Map()
        this._paths = new Map()
    }

    public get id(): uid {
        return this._id
    }

    public get nodes(): Map<uid, RenderNode> {
        return this._nodes
    }

    public get links(): Map<uid, RenderLink> {
        return this._links
    }

    public get paths(): Map<uid, RenderPath> {
        return this._paths
    }

    public addNode(node: RenderNode) {
        this._nodes.set(node.id, node)
        return this
    }

    public hasNode(id: uid): boolean {
        return this._nodes.has(id)
    }

    public getNode(id: uid): RenderNode | null {
        return this._nodes.get(id) || null
    }

    public delNode(id: node_id): RenderGraph {
        if (!this._nodes.has(id)) {
            return this
        }
        // delete all links connected to the node
        const node = this._nodes.get(id)!
        for (const port of node.ports.values()) {
            const pair = new RenderPair(node, port)
            const linkIds = this._graph.get(pair)!
            for (const linkId of linkIds) {
                const link = this._links.get(linkId)!
                if (pair.typ === PortType.OUT) {
                    const dstPair = link.dstPair
                    if (dstPair) {
                        this._graph.delete(dstPair)
                        this._links.delete(linkId)
                        this._paths.delete(linkId)
                    }
                } else {
                    const srcPair = link.srcPair
                    if (srcPair) {
                        this._graph.delete(srcPair)
                        this._links.delete(linkId)
                        this._paths.delete(linkId)
                    }
                }
            }
        }
        this._nodes.delete(id)
        return this
    }

    public addLink(
        from: RenderPair,
        to: RenderPair,
        path: RenderPath | null = null,
        linkId: link_id | null = null,
    ): link_id | null {
        // make sure from and to are in different nodes
        if (from.node === to.node) {
            console.error(
                'RenderGraph.addLink: from and to are in the same node',
            )
            return null
        }
        // make sure from and to are in different direction/types
        if (from.typ === to.typ) {
            console.error(
                'RenderGraph.addLink: from and to are in the same direction',
            )
            return null
        }
        // make sure from is the out port
        if (from.typ === PortType.IN) {
            console.error('RenderGraph.addLink: from is not the out port')
            return null
        }
        const _linkId = linkId || uid_rt()
        // add link to link graph
        if (!this._graph.has(from)) {
            this._graph.set(from, new Set([_linkId]))
        } else {
            this._graph.get(from)?.add(_linkId)
        }
        if (!this._graph.has(to)) {
            this._graph.set(to, new Set([_linkId]))
        } else {
            this._graph.get(to)?.add(_linkId)
        }
        // add link and path objects
        this._links.set(_linkId, new RenderLink(_linkId, from, to))
        const _path =
            path ||
            RenderPath.fromPoints([
                [from.pos, from.dir],
                [to.pos, to.dir],
            ])
        this._paths.set(_linkId, _path)
        return _linkId
    }

    public delLink(from: RenderPair, to: RenderPair): RenderLink | null {
        const linkIds = this._graph.get(from)
        if (!linkIds) {
            return null
        }
        for (const linkId of linkIds) {
            const link = this._links.get(linkId)!
            if (link.dstPair.equals(to)) {
                linkIds.delete(linkId)
                this._graph.get(to)?.delete(linkId)
                this._links.delete(linkId)
                this._paths.delete(linkId)
                return link
            }
        }
        return null
    }

    public moveNodeTo(id: node_id, pos: Point) {
        const node = this._nodes.get(id)
        if (!node) {
            console.error('RenderGraph.moveNodeTo: node not found')
            return
        }
        node.rect.pos = pos
        for (const port of node.ports.values()) {
            const pair = new RenderPair(node, port)
            const linkIds = this._graph.get(pair)
            if (linkIds) {
                for (const linkId of linkIds) {
                    const path = this._paths.get(linkId)!
                    if (pair.typ == PortType.IN) {
                        path.setLastWayPoint(pair.pos, path.lastDir)
                    } else {
                        path.setFirstWayPoint(pair.pos, path.firstDir)
                    }
                }
            }
        }
    }
}
