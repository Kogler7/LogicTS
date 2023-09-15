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

import { Rect } from "../common/types2D"
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

export class Text implements IRenderable {
    public text: string
    public rect: Rect
    public style: FontStyle

    constructor(rect: Rect, text: string, style: FontStyle) {
        this.rect = rect
        this.text = text
        this.style = style
        if (!style.padding) {
            style.padding = config.padding
        }
        else if (style.padding < 0) {
            // if padding is negative, we set it to 0
            console.warn("padding should not be negative")
            style.padding = 0
        }
        if (!style.lineSpacing) {
            style.lineSpacing = config.lineSpacing
        }
    }

    protected _configCtx(ctx: CanvasRenderingContext2D): void {
        ctx.font = getFontString(this.style)
        ctx.fillStyle = this.style.color || config.color
        ctx.textAlign = this.style.align || config.align as CanvasTextAlign
        ctx.textBaseline = this.style.baseline || config.baseline as CanvasTextBaseline
    }

    public renderOn(ctx: CanvasRenderingContext2D): void {
        this.renderAt(ctx, this.rect)
    }

    public renderAt(ctx: CanvasRenderingContext2D, rect: Rect): Rect {
        ctx.save()
        this._configCtx(ctx)
        const textRect = rect.padding(
            -ctx.measureText('M').width * this.style.padding!
        ).float()
        const textLines = fitTextIntoRect(
            this.text,
            textRect,
            this.style.padding!,
            this.style.lineSpacing!,
            ctx
        )
        let curHeight = 0
        for (const textLine of textLines) {
            ctx.fillText(textLine.text, textRect.left, textRect.top + curHeight)
            curHeight += textLine.metrics.height * (this.style.lineSpacing || config.lineSpacing)
        }
        ctx.restore()
        return rect
    }
}

export class LogicText extends Text {
    private _core: LogicCore | null = null
    public fontSize: number

    constructor(rect: Rect, text: string, style: FontStyle) {
        super(rect, text, style)
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