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
 * Created: Aug. 21, 2023
 * Supported by: National Key Research and Development Program of China
 */

import { ICloneable } from '../common/types'
import { Point, Line, Rect } from '../common/types2D'
import { uid } from '../common/uid'

export default interface IObjectArena<T> extends ICloneable<IObjectArena<T>> {
    get empty(): boolean
    get objects(): Map<uid, T>
    get boundRect(): Rect
    set tolerance(val: number)
    set cropRect(rect: Rect | null)
    addObject(id: uid, obj: T): boolean
    getObject(id: uid): T | null
    setObject(id: uid, obj: T): boolean
    delObject(id: uid): boolean
    posOccupied(pos: Point): uid | null
    lineOccupied(line: Line, except: uid): uid | null
    rectOccupied(rect: Rect, except: uid, fill: boolean): uid | null
    lineOccupiedSet(line: Line, except: uid): Set<uid>
    rectOccupiedSet(rect: Rect, except: uid, fill: boolean): Set<uid>
}
