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
* Created: Sep. 7, 2023
* Supported by: National Key Research and Development Program of China
*/

import LogicLayer from "../logic/layer"
import { Point, Rect, Vector } from "@/logic/common/types2D"
import { uid } from "@/logic/common/uid"
import LogicCore from "@/logic/core"
import IRenderable from "@/logic/mixins/renderable"
import { IMovable } from "@/logic/mixins/movable"
import { Animation, Curves } from "@/logic/utils/anime"
import LogicConfig from "@/logic/config"

export default class MoveObjectLayer extends LogicLayer {
    private _moving: boolean = false
    private _movingFrameElapsed: number = 0
    private _movingObjects: Set<IMovable> = new Set()
    private _movingObjectStates: Map<uid, boolean> = new Map()
    private _movingScaledObjectsBias: Map<uid, Vector> = new Map()
    private _movingScaledObjectsRect: Map<uid, Rect> = new Map()

    // for animation
    private _currentScaledObjectsRect: Map<uid, Rect> = new Map()
    private _currentTargetObjectsRect: Map<uid, Rect> = new Map()

    private _scaleAnimating: boolean = false
    private _targetAnimating: boolean = false

    private _okColor: string = LogicConfig.layers.occupy.okColor
    private _noColor: string = LogicConfig.layers.occupy.noColor

    public onMounted(core: LogicCore) {
        this._movingObjects = core.movingLogicObjects
        this._movingObjectStates = core.movingLogicObjectStates
        core.on("movobj.logic.begin", this._onMoveObjectBegin.bind(this))
        core.on("movobj.logic.end", this._onMoveObjectEnd.bind(this))
        core.on("movobj.logic.ing", this._onMovingObject.bind(this))
        core.on("movobj.logic.step", this._onMovingObjectStep.bind(this))
        core.on('memory.switch.before', () => {
            this._moving = false
            this._movingFrameElapsed = 0
            this._scaleAnimating = false
            this._targetAnimating = false
        })
        core.on('memory.switch.after', () => {
            this._movingObjects = core.movingLogicObjects
            this._movingObjectStates = core.movingLogicObjectStates
        })
    }

    private _updateAnimeFrame() {
        if (!this._moving) return
        this._movingFrameElapsed++
        this.core?.render()
        requestAnimationFrame(this._updateAnimeFrame.bind(this))
    }

    private _onMoveObjectBegin(pos: Point) {
        this._moving = true
        // init moving objects bias
        for (const obj of this._movingObjects) {
            // if mouse pos is in the object, scale the object to the mouse pos
            // else scale the object to the its center
            let scaled: Rect
            if (obj.rect.containsPoint(pos)) {
                scaled = obj.rect.scale(0.7, pos)
            } else {
                scaled = obj.rect.scale(0.7, obj.rect.center)
            }
            this._movingScaledObjectsBias.set(obj.id, Vector.fromPoints(pos, scaled.pos))
            this._movingScaledObjectsRect.set(obj.id, scaled)
            this._currentScaledObjectsRect.set(obj.id, obj.rect.clone())
            this._currentTargetObjectsRect.set(obj.id, obj.target.clone())
        }
        // start scale animation
        for (const obj of this._movingObjects) {
            const target = this._movingScaledObjectsRect.get(obj.id)!
            const scaleAnime = new Animation(
                (progress: number) => {
                    this._currentScaledObjectsRect.set(obj.id, obj.rect.lerp(target, progress))
                    this.core!.render()
                },
                300,
                Curves.easeInOut,
                () => {
                    this._scaleAnimating = true
                },
                () => {
                    this._scaleAnimating = false
                }
            )
            scaleAnime.start()
        }
        this._updateAnimeFrame()
        this.core!.renderAll()
    }

    private _onMoveObjectEnd(pos: Point) {
        this._movingFrameElapsed = 0
        // start scale animation
        for (const obj of this._movingObjects) {
            const curr = this._movingScaledObjectsRect.get(obj.id)!.clone()
            const scaleAnime = new Animation(
                (progress: number) => {
                    this._currentScaledObjectsRect.set(obj.id, curr.lerp(obj.rect, progress))
                    this.core!.render()
                },
                200,
                Curves.easeInOut,
                () => {
                    this._scaleAnimating = true
                },
                () => {
                    this._scaleAnimating = false
                    this._moving = false
                    this.core!.fire("movobj.logic.finish")
                }
            )
            const curTarget = this._currentTargetObjectsRect.get(obj.id)!
            const oldTarget = curTarget.clone()
            const targetAnime = new Animation(
                (progress: number) => {
                    const targetPos = oldTarget.pos.lerp(obj.rect.pos, progress)
                    curTarget.pos = targetPos
                    this.core!.render()
                },
                150,
                Curves.easeInOut
            )
            scaleAnime.start()
            targetAnime.start()
        }
        this.core!.fire("update-bound")
        this.core!.fire("select.logic-changed")
        this.core!.renderAll()
    }

    private _onMovingObject(oldPos: Point, newPos: Point) {
        for (const [id, rect] of this._movingScaledObjectsRect) {
            const bias = this._movingScaledObjectsBias.get(id)!
            rect.moveTo(newPos.shift(bias))
        }
    }

    private _onMovingObjectStep() {
        if (this._targetAnimating) return
        for (const obj of this._movingObjects) {
            const curTarget = this._currentTargetObjectsRect.get(obj.id)!
            const oldTarget = curTarget.clone()
            const moveTargetAnime = new Animation(
                (progress: number) => {
                    const targetPos = oldTarget.pos.lerp(obj.target.pos, progress)
                    curTarget.pos = targetPos
                    this.core!.render()
                },
                150,
                Curves.easeInOut,
                () => {
                    this._targetAnimating = true
                },
                () => {
                    this._targetAnimating = false
                }
            )
            moveTargetAnime.start()
        }
    }

    public onPaint(ctx: CanvasRenderingContext2D): boolean {
        if (!this._moving) return false
        ctx.setLineDash([5, 5])
        ctx.lineDashOffset = -this._movingFrameElapsed / 2
        ctx.lineWidth = 2
        for (const obj of this._movingObjects) {
            const target = this._currentTargetObjectsRect.get(obj.id)!
            const renderRect = this.core!.crd2posRect(target).float()
            const state = this._movingObjectStates.get(obj.id)
            ctx.strokeStyle = state ? this._okColor : this._noColor
            ctx.strokeRect(...renderRect.ltwh)
        }
        ctx.setLineDash([])
        // render scaled mini objects
        for (const obj of this._movingObjects) {
            let rect: Rect
            if (this._scaleAnimating) {
                rect = this._currentScaledObjectsRect.get(obj.id)!
            } else {
                rect = this._movingScaledObjectsRect.get(obj.id)!
            }
            const renderRect = this.core!.crd2posRect(rect).float();
            (obj as unknown as IRenderable).renderAt(ctx, renderRect)
        }
        return true
    }
}