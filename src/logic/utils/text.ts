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
* Created: Sep. 11, 2023
* Supported by: National Key Research and Development Program of China
*/

import { Point, Rect, Size } from "../common/types2D"
import LogicConfig from "../config"
import LogicCore from "../core"
import IRenderable from "../mixins/renderable"

const config = LogicConfig.objects.text

export type TextLineMetrics = {
    width: number
    height: number
}

export type TextLine = {
    text: string
    metrics: TextLineMetrics
}

export type FontStyle = {
    size?: number
    family?: string
    weight?: string
    style?: string
    color?: string
}

export type FontAlign = {
    align?: CanvasTextAlign
    padding?: number
    baseline?: CanvasTextBaseline
    lineSpacing?: number
}

export function getFontString(style: FontStyle): string {
    const size = style.size || config.size
    const family = style.family || config.family
    const weight = style.weight || config.weight
    const styleStr = style.style || config.style
    return `${styleStr} ${weight} ${size}px ${family}`
}

export interface IText {
    get text(): string
    set text(value: string)
    get style(): FontStyle
    set style(value: FontStyle)
    get align(): FontAlign
    set align(value: FontAlign)
    calcSize(ctx: CanvasRenderingContext2D): Size
    renderAt(ctx: CanvasRenderingContext2D, pos: Point): void
}

export class Text implements IText {
    public text: string
    public style: FontStyle
    public align: FontAlign

    constructor(text: string, style: FontStyle = {}, align: FontAlign = {}) {
        this.text = text
        this.style = style
        this.align = align
    }

    public calcSize(ctx: CanvasRenderingContext2D): Size {
        ctx.save()
        ctx.font = getFontString(this.style)
        const metrics = ctx.measureText(this.text)
        ctx.restore()
        return new Size(
            metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight,
            metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
        )
    }

    public renderAt(ctx: CanvasRenderingContext2D, pos: Point): void {
        ctx.save()
        ctx.font = getFontString(this.style)
        ctx.fillStyle = this.style.color || config.color
        ctx.textAlign = this.align.align || config.align as CanvasTextAlign
        ctx.textBaseline = this.align.baseline || config.baseline as CanvasTextBaseline
        ctx.fillText(this.text, pos.x, pos.y)
        ctx.restore()
    }
}

export class TextArea implements IRenderable {
    public rect: Rect
    public text: string
    public style: FontStyle
    public align: FontAlign

    constructor(rect: Rect, text: string, style: FontStyle, align: FontAlign) {
        this.rect = rect
        this.text = text
        this.style = style
        this.align = align
        if (!align.padding) {
            align.padding = config.padding
        }
        else if (align.padding < 0) {
            // if padding is negative, we set it to 0
            console.warn("padding should not be negative")
            align.padding = 0
        }
        if (!align.lineSpacing) {
            align.lineSpacing = config.lineSpacing
        }
    }

    protected _configCtx(ctx: CanvasRenderingContext2D): void {
        ctx.font = getFontString(this.style)
        ctx.fillStyle = this.style.color || config.color
        ctx.textAlign = this.align.align || config.align as CanvasTextAlign
        ctx.textBaseline = this.align.baseline || config.baseline as CanvasTextBaseline
    }

    public renderOn(ctx: CanvasRenderingContext2D): void {
        this.renderAt(ctx, this.rect)
    }

    public renderAt(ctx: CanvasRenderingContext2D, rect: Rect): Rect {
        ctx.save()
        this._configCtx(ctx)
        const textRect = Rect.padding(
            rect,
            -ctx.measureText('M').width * this.align.padding!
        ).float()
        const textLines = fitTextIntoRect(
            this.text,
            textRect,
            this.align.padding!,
            this.align.lineSpacing!,
            ctx
        )
        let curHeight = 0
        for (const textLine of textLines) {
            ctx.fillText(textLine.text, textRect.left, textRect.top + curHeight)
            curHeight += textLine.metrics.height * (this.align.lineSpacing || config.lineSpacing)
        }
        ctx.restore()
        return rect
    }
}

export class LogicTextArea extends TextArea {
    private _core: LogicCore | null = null
    public fontSize: number

    constructor(rect: Rect, text: string, style: FontStyle, align: FontAlign) {
        super(rect, text, style, align)
        this.fontSize = style.size || config.size
    }

    public setCore(core: LogicCore): void {
        this._core = core
    }

    protected _configCtx(ctx: CanvasRenderingContext2D): void {
        let realSize = this.fontSize * (this._core?.logicWidth ?? 1) * config.logicFactor
        this.style.size = realSize
        super._configCtx(ctx)
    }
}

function measureText(text: string, ctx: CanvasRenderingContext2D): TextLineMetrics {
    const metrics = ctx.measureText(text)
    return {
        width: metrics.width,
        height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
    }
}

function splitTextByWidth(
    text: string,
    maxWidth: number,
    padding: number,
    ctx: CanvasRenderingContext2D
): TextLine[] {
    const rawWords = text.split(' ')
    const words: string[] = []
    for (const rawWord of rawWords) {
        const chars = rawWord.split('')
        let word = ''
        for (const char of chars) {
            // if the char is not English, push the word into words
            // else we try to find out the whole english word
            const isEnglish = /^[a-zA-Z]$/.test(char)
            if (!isEnglish) {
                words.push(char)
                if (word.length > 0) {
                    words.push(word)
                    word = ''
                }
            } else {
                word += char
            }
        }
        if (word.length > 0) {
            words.push(word)
            word = ''
        }
        words.push(' ')
    }
    const lines: TextLine[] = []
    let line = ''
    for (const word of words) {
        const metrics = measureText(line + word, ctx)
        if (metrics.width > maxWidth - padding * 2) {
            lines.push({
                text: line,
                metrics: metrics
            })
            line = word
        } else {
            line += word
        }
    }
    if (line.length > 0) {
        lines.push({
            text: line,
            metrics: measureText(line, ctx)
        })
    }
    return lines
}

function fitTextIntoRect(
    text: string,
    rect: Rect,
    padding: number,
    lineSpacing: number,
    ctx: CanvasRenderingContext2D
): TextLine[] {
    const textLines: TextLine[] = []
    const lines = text.split(/\r?\n/)
    const heightPadding = ctx.measureText('M').width * padding
    let curHeight = heightPadding
    for (const line of lines) {
        const splitLines = splitTextByWidth(line, rect.width, padding, ctx)
        for (const splitLine of splitLines) {
            if (curHeight + splitLine.metrics.height > rect.height) {
                return textLines
            }
            textLines.push(splitLine)
            curHeight += splitLine.metrics.height * lineSpacing
        }
    }
    return textLines
}