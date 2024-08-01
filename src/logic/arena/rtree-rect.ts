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

import IObjectArena from './arena'
import { Point, Line, Rect } from '../common/types2D'
import { uid } from '../common/uid'

// export class RTreeObjectArena implements IObjectArena {
//     public get boundRect(): Rect { }

//     public addObject(id: uid, rect: Rect): boolean { }

//     public getObject(id: uid): Rect | null { }

//     public setObject(id: uid, rect: Rect): boolean { }

//     public delObject(id: uid): boolean { }

//     public posOccupied(pos: Point): uid | null { }

//     public lineOccupied(line: Line, except: uid): uid | null { }

//     public rectOccupied(rect: Rect, except: uid, fill: boolean): uid | null { }

//     public lineOccupiedList(line: Line, except: uid): uid[] { }

//     public rectOccupiedList(rect: Rect, except: uid, fill: boolean): uid[] { }
// }

// export class CanvasObjectArena implements IObjectArena {
//     public get boundRect(): Rect { }
//     public addObject(id: uid, rect: Rect): boolean { }
//     public getObject(id: uid): Rect | null { }
//     public setObject(id: uid, rect: Rect): boolean { }
//     public delObject(id: uid): boolean { }
//     public posOccupied(pos: Point): uid | null { }
//     public lineOccupied(line: Line, except: uid): uid | null { }
//     public rectOccupied(rect: Rect, except: uid, fill: boolean): uid | null { }
//     public lineOccupiedList(line: Line, except: uid): uid[] { }
//     public rectOccupiedList(rect: Rect, except: uid, fill: boolean): uid[] { }
// }
