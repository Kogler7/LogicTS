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

import { Rect, Point } from "@/logic/common/types2D"
import { HashSet, HashMap } from "@/logic/common/types"
import { uid, uid_rt } from "@/logic/common/uid"
import { RenderNode, RenderPair, RenderPortDirection } from "./node"
import { RenderLink } from "./link"
import { RenderPath } from "./path"

// export class RenderGraph {
//     private _id: uid
//     private _graph: HashMap<RenderNode, HashSet<RenderNode>>
//     private _nodes: Map<uid, RenderNode>
//     private _links: HashMap<RenderPair, RenderLink>
//     private _routes: HashMap<RenderPair, RenderPath>
//     private _padding: number

//     constructor(id: uid, padding: number) {
//         this._id = id
//         this._padding = padding
//         this._graph = new HashMap()
//         this._nodes = new Map()
//         this._links = new HashMap()
//         this._routes = new HashMap()
//     }

//     public get id(): uid {
//         return this._id
//     }

//     public get nodes(): Array<RenderNode> {
//         return Array.from(this._graph.keys)
//     }

//     public get nodesMap(): Map<uid, RenderNode> {
//         return this._nodes
//     }

//     public get routes(): RenderPath[] {
//         return this._routes.uniqueValues
//     }

//     public addNode(node: RenderNode) {
//         this._graph.set(node, new HashSet<RenderNode>())
//         this._nodes.set(node.id, node)
//         return this
//     }

//     public getNode(id: uid): RenderNode | null {
//         return this._nodes.get(id) || null
//     }

//     public deleteNode(node: RenderNode) {
//         const neighbors = this._graph.get(node)
//         if (neighbors) {
//             neighbors.forEach((neighbor) => {
//                 this._graph.get(neighbor)?.delete(node)
//             })
//         }
//         for (const port of node.ports) {
//             const pair = new RenderPair(node, port)
//             if (pair.dir === RenderPortDirection.IN) {
//                 const outPair = this._routes.get(pair)?.startPair
//                 if (outPair) {
//                     this._routes.delete(outPair)
//                 }
//             } else {
//                 const inPair = this._routes.get(pair)?.targetPair
//                 if (inPair) {
//                     this._routes.delete(inPair)
//                 }
//             }
//             this._routes.delete(pair)
//         }
//         this._graph.delete(node)
//         this._nodes.delete(node.id)
//         return this
//     }

//     public getRoute(pair: RenderPair): RenderPath | null {
//         return this._routes.get(pair)
//     }

//     public getLink(pair: RenderPair): RenderLink | null {
//         return this._links.get(pair)
//     }

//     public addLink(
//         from: RenderPair,
//         to: RenderPair,
//         route: RenderPath | null = null,
//         linkId: uid | null = null
//     ): boolean {
//         // make sure from and to are in different nodes
//         if (from.node === to.node) {
//             console.error('RenderGraph.addLink: from and to are in the same node')
//             return false
//         }
//         // make sure from and to are in different direction
//         if (from.dir === to.dir) {
//             console.error('RenderGraph.addLink: from and to are in the same direction')
//             return false
//         }
//         // make sure from is the out port
//         if (from.dir === RenderPortDirection.IN) {
//             const tmp = from
//             from = to
//             to = tmp
//         }
//         // link already exists
//         // if (this._links.has(from) || this._links.has(to)) {
//         //     return false
//         // }
//         if (linkId === null) {
//             console.warn('RenderGraph.addLink: linkId is null, generate a new one')
//             linkId = uid_rt()
//         }
//         const link = new RenderLink(linkId, from, to)
//         this._links.set(from, link).set(to, link)
//         this._graph.get(from.node)?.add(to.node)
//         this._graph.get(to.node)?.add(from.node)
//         if (route === null) {
//             // route = this._navi.startAt(from).endAt(to).generateRoute()
//         }
//         route.linkId = link.id
//         this._routes.set(from, route).set(to, route)
//         return true
//     }

//     public delLink(from: RenderPair, to: RenderPair): RenderLink | null {
//         const link = this._links.get(from)
//         if (!link) {
//             return null
//         }
//         this._graph.get(from.node)?.delete(to.node)
//         this._graph.get(to.node)?.delete(from.node)
//         this._links.delete(from).delete(to)
//         this._routes.delete(from).delete(to)
//         return link
//     }

//     public moveNodeTo(node: RenderNode, pos: Point) {
//         if (node.rect.pos.equals(pos)) {
//             return
//         }
//         const newRect = new Rect(pos, node.rect.size)
//         // this._arena.setNode(node.id, newRect)
//         node.ports.forEach((port) => {
//             const pair = new RenderPair(node, port)
//             const route = this._routes.get(pair)
//             if (route) {
//                 route.printToConsole()
//                 route.printFixedStates()
//                 route.movePairTo(pair, pair.location(this._padding), this._navi)
//             }
//         })
//         // save to server
//         // graphManager.moveNodeTo(node.id, pos)
//     }

//     public deserialize(data: object) {
//         this.clear()
//     }

//     get size(): number {
//         return this._graph.size
//     }

//     public get graph(): HashMap<RenderNode, HashSet<RenderNode>> {
//         return this._graph
//     }

//     public clear() {
//         this._graph.clear()
//     }
// }