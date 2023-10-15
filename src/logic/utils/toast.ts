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

import { Rect, Point, Size } from "../common/types2D"
import LogicCore from "../core"
import IRenderable from "../mixins/renderable"
import { Animation, Curves } from "./anime"
import { FontStyle, Text, IText } from "./text"

export enum ToastBaseline {
    TOP = 'top',
    BOTTOM = 'bottom',
    LEFT = 'left',
    RIGHT = 'right',
}

export default class Toast implements IRenderable {
    private _core: LogicCore
    private _text: IText = new Text('', {}, {
        align: 'center',
        baseline: 'middle',
    })

    private _rect: Rect = Rect.zero()
    private _innerAnchor: Point = new Point()
    private _outerAnchor: Point = new Point()

    private _timer: number = 0
    private _duration: number = 0
    private _animeDuration: number = 300

    private _radius: number = 0
    private _hidden: boolean = true
    private _padding: number = 10
    private _baseline: ToastBaseline

    private _ctx: CanvasRenderingContext2D

    public get text(): string {
        return this._text.text
    }

    public set text(value: string) {
        this._text.text = value
        // update the size of the toast
        const size = this._text.calcSize(this._ctx)
        this._rect.fitWidthTo(size.width + this._padding * 2, true)
        this._rect.fitHeightTo(size.height + this._padding * 2, true)
    }

    public get padding(): number {
        return this._padding
    }

    public set padding(value: number) {
        this._padding = value
        // update the size of the toast
        const size = this._text.calcSize(this._ctx)
        this._rect.fitWidthTo(size.width + this._padding * 2, true)
        this._rect.fitHeightTo(size.height + this._padding * 2, true)
    }

    public get style(): FontStyle {
        return this._text.style
    }

    public set style(value: FontStyle) {
        this._text.style = value
    }

    public get anchor(): Point {
        return this._innerAnchor
    }

    public set anchor(value: Point) {
        this._innerAnchor = value
        this._calcOuterAnchor()
    }

    public get baseline(): ToastBaseline {
        return this._baseline
    }

    public set baseline(value: ToastBaseline) {
        this._baseline = value
        this._calcOuterAnchor()
    }

    private _calcOuterAnchor(): void {
        if (this._baseline === ToastBaseline.TOP) {
            this._outerAnchor = new Point(
                this._innerAnchor.x,
                -this._rect.height / 2 - this._padding
            )
        } else if (this._baseline === ToastBaseline.BOTTOM) {
            this._outerAnchor = new Point(
                this._innerAnchor.x,
                this._core.stageHeight + this._rect.height / 2 + this._padding
            )
        } else if (this._baseline === ToastBaseline.LEFT) {
            this._outerAnchor = new Point(
                -this._rect.width / 2 - this._padding,
                this._innerAnchor.y
            )
        } else if (this._baseline === ToastBaseline.RIGHT) {
            this._outerAnchor = new Point(
                this._core.stageWidth + this._rect.width / 2 + this._padding,
                this._innerAnchor.y
            )
        }
    }

    constructor(
        core: LogicCore,
        anchor: Point,
        text: string = '',
        padding: number = 10,
        baseline: ToastBaseline = ToastBaseline.BOTTOM,
        duration: number = 300
    ) {
        this._core = core
        this.text = text
        this._innerAnchor = anchor
        this._padding = padding
        this._baseline = baseline
        this._calcOuterAnchor()
        this._animeDuration = duration
        this._ctx = core.requireCache('__toast__', Size.zero())
    }

    public renderAt(ctx: CanvasRenderingContext2D, rect: Rect): Rect {
        const { left, top, width, height } = rect
        const radius = this._radius
        ctx.save()
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
        ctx.beginPath()
        ctx.moveTo(left + radius, top)
        ctx.lineTo(left + width - radius, top)
        ctx.quadraticCurveTo(left + width, top, left + width, top + radius)
        ctx.lineTo(left + width, top + height - radius)
        ctx.quadraticCurveTo(left + width, top + height, left + width - radius, top + height)
        ctx.lineTo(left + radius, top + height)
        ctx.quadraticCurveTo(left, top + height, left, top + height - radius)
        ctx.lineTo(left, top + radius)
        ctx.quadraticCurveTo(left, top, left + radius, top)
        ctx.closePath()
        ctx.fill()
        ctx.restore()

        this._text.renderAt(ctx, rect.center)

        return rect
    }

    public renderOn(ctx: CanvasRenderingContext2D): void {
        if (this._hidden) {
            return
        }
        this.renderAt(ctx, this._rect)
    }

    public show(duration: number | null = null, text: string | null): void {
        if (text) {
            this.text = text
        }
        if (!this._hidden) {
            return
        }
        const source = this._rect.clone()
        const target = Rect.moveCenterTo(this._rect, this._innerAnchor)
        const anime = new Animation(
            (t: number) => {
                // this._rect = Rect.lerp(source, target, t)
                this._core.render()
            },
            this._animeDuration,
            Curves.easeIn
        )
    }
}