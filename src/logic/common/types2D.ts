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
* Created: Jul. 21, 2023
* Supported by: National Key Research and Development Program of China
*/

import { IComparable, IHashable, hash, IPrintable, ICloneable } from "./types"

export type Element = null | Line | Point | Rect
export type PairTuple = readonly [number, number]
export type SquareTuple = readonly [number, number, number, number]

const HASH_UNIT = 1e4

export enum Direction {
	LEFT,
	RIGHT,
	UP,
	DOWN
}

/**
 * Size class for 2D applications.
 * @param width the width of the size.
 * @param height the height of the size.
 */
export class Size implements IComparable, IHashable, IPrintable, ICloneable<Size> {
	constructor(public width: number = 0, public height: number = 0) { }

	static zero(): Size {
		return new Size(0, 0)
	}

	static lerp(s1: Size, s2: Size, factor: number): Size {
		return new Size(
			s1.width + (s2.width - s1.width) * factor,
			s1.height + (s2.height - s1.height) * factor
		)
	}

	public isZero(): boolean {
		return this.width === 0 && this.height === 0
	}

	public floor(): Size {
		this.width = Math.floor(this.width)
		this.height = Math.floor(this.height)
		return this
	}

	static floor(s: Size): Size {
		return new Size(Math.floor(s.width), Math.floor(s.height))
	}

	public ceil(): Size {
		this.width = Math.ceil(this.width)
		this.height = Math.ceil(this.height)
		return this
	}

	static ceil(s: Size): Size {
		return new Size(Math.ceil(s.width), Math.ceil(s.height))
	}

	public round(): Size {
		this.width = Math.round(this.width)
		this.height = Math.round(this.height)
		return this
	}

	static round(s: Size): Size {
		return new Size(Math.round(s.width), Math.round(s.height))
	}

	public decimal(): Size {
		this.width = this.width - Math.floor(this.width)
		this.height = this.height - Math.floor(this.height)
		return this
	}

	static decimal(s: Size): Size {
		return new Size(s.width - Math.floor(s.width), s.height - Math.floor(s.height))
	}

	public float(): Size {
		this.width = Math.round(this.width) + 0.5
		this.height = Math.round(this.height) + 0.5
		return this
	}

	static float(s: Size): Size {
		return new Size(Math.round(s.width) + 0.5, Math.round(s.height) + 0.5)
	}

	public plus(s: Size): Size {
		this.width = this.width + s.width
		this.height = this.height + s.height
		return this
	}

	static plus(s1: Size, s2: Size): Size {
		return new Size(s1.width + s2.width, s1.height + s2.height)
	}

	public minus(s: Size): Size {
		this.width = this.width - s.width
		this.height = this.height - s.height
		return this
	}

	static minus(s1: Size, s2: Size): Size {
		return new Size(s1.width - s2.width, s1.height - s2.height)
	}

	public times(factor: number): Size {
		this.width = this.width * factor
		this.height = this.height * factor
		return this
	}

	static times(s: Size, factor: number): Size {
		return new Size(s.width * factor, s.height * factor)
	}

	public divide(factor: number): Size {
		this.width = this.width / factor
		this.height = this.height / factor
		return this
	}

	static divide(s: Size, factor: number): Size {
		return new Size(s.width / factor, s.height / factor)
	}

	public scale(factor: number): Size {
		this.width = this.width * factor
		this.height = this.height * factor
		return this
	}

	static scale(s: Size, factor: number): Size {
		return new Size(s.width * factor, s.height * factor)
	}

	public equals(s: Size): boolean {
		return this.width === s.width && this.height === s.height
	}

	public clone(): Size {
		return new Size(this.width, this.height)
	}

	public get values(): PairTuple {
		return [this.width, this.height] as PairTuple
	}

	public get hash(): number {
		return this.width * HASH_UNIT + this.height
	}

	public get desc(): string {
		return `Size[${this.width.toFixed(2)}, ${this.height.toFixed(2)}]`
	}
}

/**
 * Point class for 2D applications.
 * @param x the x coordinate of the point.
 * @param y the y coordinate of the point.
 */
export class Point implements IComparable, IHashable, IPrintable, ICloneable<Point> {
	constructor(public x: number = 0, public y: number = 0) { }

	static zero(): Point {
		return new Point(0, 0)
	}

	static lerp(p1: Point, p2: Point, factor: number): Point {
		return new Point(
			p1.x + (p2.x - p1.x) * factor,
			p1.y + (p2.y - p1.y) * factor
		)
	}

	public moveTo(p: Point) {
		this.x = p.x
		this.y = p.y
	}

	public isZero(): boolean {
		return this.x === 0 && this.y === 0
	}

	public scale(factor: number, center: Point): Point {
		this.x = center.x + (this.x - center.x) * factor
		this.y = center.y + (this.y - center.y) * factor
		return this
	}

	static scale(p: Point, factor: number, center: Point): Point {
		return new Point(
			center.x + (p.x - center.x) * factor,
			center.y + (p.y - center.y) * factor
		)
	}

	public lessEqual(p: Point): boolean {
		return this.x <= p.x && this.y <= p.y
	}

	public round(): Point {
		this.x = Math.round(this.x)
		this.y = Math.round(this.y)
		return this
	}

	static round(p: Point): Point {
		return new Point(Math.round(p.x), Math.round(p.y))
	}

	public ceil(): Point {
		this.x = Math.ceil(this.x)
		this.y = Math.ceil(this.y)
		return this
	}

	static ceil(p: Point): Point {
		return new Point(Math.ceil(p.x), Math.ceil(p.y))
	}

	public floor(): Point {
		this.x = Math.floor(this.x)
		this.y = Math.floor(this.y)
		return this
	}

	static floor(p: Point): Point {
		return new Point(Math.floor(p.x), Math.floor(p.y))
	}

	public decimal(): Point {
		this.x = this.x - Math.floor(this.x)
		this.y = this.y - Math.floor(this.y)
		return this
	}

	static decimal(p: Point): Point {
		return new Point(p.x - Math.floor(p.x), p.y - Math.floor(p.y))
	}

	public float(): Point {
		this.x = Math.round(this.x) + 0.5
		this.y = Math.round(this.y) + 0.5
		return this
	}

	static float(p: Point): Point {
		return new Point(Math.round(p.x) + 0.5, Math.round(p.y) + 0.5)
	}

	public plus(p: Point): Point {
		this.x = this.x + p.x
		this.y = this.y + p.y
		return this
	}

	static plus(p1: Point, p2: Point): Point {
		return new Point(p1.x + p2.x, p1.y + p2.y)
	}

	public minus(p: Point): Point {
		this.x = this.x - p.x
		this.y = this.y - p.y
		return this
	}

	static minus(p1: Point, p2: Point): Point {
		return new Point(p1.x - p2.x, p1.y - p2.y)
	}

	public times(factor: number): Point {
		this.x = this.x * factor
		this.y = this.y * factor
		return this
	}

	static times(p: Point, factor: number): Point {
		return new Point(p.x * factor, p.y * factor)
	}

	public divide(factor: number): Point {
		this.x = this.x / factor
		this.y = this.y / factor
		return this
	}

	static divide(p: Point, factor: number): Point {
		return new Point(p.x / factor, p.y / factor)
	}

	public mod(factor: number): Point {
		this.x = this.x - Math.floor(this.x / factor) * factor
		this.y = this.y - Math.floor(this.y / factor) * factor
		return this
	}

	static mod(p: Point, factor: number): Point {
		return new Point(p.x - Math.floor(p.x / factor) * factor, p.y - Math.floor(p.y / factor) * factor)
	}

	/**
	 * Shift the point by a vector.
	 * @param v the vector to shift the point.
	 * @return the shifted point.
	 */
	public shift(v: Vector): Point {
		this.x = this.x + v.vx
		this.y = this.y + v.vy
		return this
	}

	static shift(p: Point, v: Vector): Point {
		return new Point(p.x + v.vx, p.y + v.vy)
	}

	public shiftX(dx: number): Point {
		this.x = this.x + dx
		return this
	}

	static shiftX(p: Point, dx: number): Point {
		return new Point(p.x + dx, p.y)
	}

	public shiftY(dy: number): Point {
		this.y = this.y + dy
		return this
	}

	static shiftY(p: Point, dy: number): Point {
		return new Point(p.x, p.y + dy)
	}

	public clone(): Point {
		return new Point(this.x, this.y)
	}

	public equals(p: Point): boolean {
		return this.x === p.x && this.y === p.y
	}

	public get values(): PairTuple {
		return [this.x, this.y] as PairTuple
	}

	public get hash(): number {
		return this.x * HASH_UNIT + this.y
	}

	public get normalDir(): Direction {
		if (Math.abs(this.x) >= Math.abs(this.y)) {
			return this.x >= 0 ? Direction.RIGHT : Direction.LEFT
		} else {
			return this.y >= 0 ? Direction.DOWN : Direction.UP
		}
	}

	public get desc(): string {
		return `Point(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`
	}
}

/**
 * Line class for 2D applications.
 * @param p1 the start point of the line.
 * @param p2 the end point of the line.
 */
export class Line implements IComparable, IHashable, IPrintable, ICloneable<Line> {
	constructor(public p1: Point, public p2: Point) { }

	public clone(): Line {
		return new Line(this.p1.clone(), this.p2.clone())
	}

	/**
	 * Shift the line by a vector.
	 * @param v the vector to shift the line.
	 * @returns the shifted line.
	 */
	public shift(v: Vector): Line {
		this.p1.shift(v)
		this.p2.shift(v)
		return this
	}

	static shift(l: Line, v: Vector): Line {
		return new Line(
			Point.shift(l.p1, v),
			Point.shift(l.p2, v)
		)
	}

	public equals(l: Line): boolean {
		return (this.p1.equals(l.p1) && this.p2.equals(l.p2)) ||
			(this.p1.equals(l.p2) && this.p2.equals(l.p1))
	}

	public contains(p: Point): boolean {
		if (this.vertical) {
			return p.x === this.p1.x &&
				p.y >= Math.min(this.p1.y, this.p2.y) &&
				p.y <= Math.max(this.p1.y, this.p2.y)
		} else if (this.horizontal) {
			return p.y === this.p1.y &&
				p.x >= Math.min(this.p1.x, this.p2.x) &&
				p.x <= Math.max(this.p1.x, this.p2.x)
		} else {
			return false
		}
	}

	/**
	 * For each point on the line, call the callback function.
	 * @param callback the callback function.
	 * @param step the step of the loop, used to control the density of the points.
	 */
	public forEach(callback: (x: number, y: number) => void, step = 1): void {
		const x1 = Math.min(this.p1.x, this.p2.x)
		const x2 = Math.max(this.p1.x, this.p2.x)
		const y1 = Math.min(this.p1.y, this.p2.y)
		const y2 = Math.max(this.p1.y, this.p2.y)
		if (x1 === x2) {
			// Vertical line
			for (let y = y1; y <= y2; y += step) callback(x1, y)
			// If the step is not properly set, the last point may be missed,
			// so we need to check it and add it manually, if necessary.
			if ((y2 - y1) % step !== 0) callback(x1, y2)
		} else if (y1 === y2) {
			// Horizontal line.
			for (let x = x1; x <= x2; x += step) callback(x, y1)
			// The same as above.
			if ((x2 - x1) % step !== 0) callback(x2, y1)
		} else {
			const k = (this.p2.y - this.p1.y) / (this.p2.x - this.p1.x)
			const b = this.p1.y - k * this.p1.x
			for (let x = x1; x <= x2; x += step) {
				const y = k * x + b
				if (y >= y1 && y <= y2) callback(x, y)
			}
			// Simply add the last point to avoid missing it.
			callback(y1, y2)
		}
	}

	/**
	 * For each point on the line, call the callback function and return the result.
	 * @param callback the callback function.
	 * @param step the step of the loop, used to control the density of the points.
	 * @return true if the callback function returns true for any point on the line.
	 */
	public some(callback: (x: number, y: number) => boolean, step = 1): boolean {
		// First check the two end points.
		if (callback(this.p1.x, this.p1.y)) return true
		if (callback(this.p2.x, this.p2.y)) return true
		// Then check the rest points.
		// The following code is similar to the forEach method.
		const x1 = Math.min(this.p1.x, this.p2.x)
		const x2 = Math.max(this.p1.x, this.p2.x)
		const y1 = Math.min(this.p1.y, this.p2.y)
		const y2 = Math.max(this.p1.y, this.p2.y)
		if (x1 === x2) {
			for (let y = y1; y <= y2; y += step) if (callback(x1, y)) return true
			if ((y2 - y1) % step !== 0) if (callback(x1, y2)) return true
		}
		else if (y1 === y2) {
			for (let x = x1; x <= x2; x += step) if (callback(x, y1)) return true
			if ((x2 - x1) % step !== 0) if (callback(x2, y1)) return true
		}
		else {
			const k = (this.p2.y - this.p1.y) / (this.p2.x - this.p1.x)
			const b = this.p1.y - k * this.p1.x
			for (let x = x1; x <= x2; x += step) {
				const y = k * x + b
				if (y >= y1 && y <= y2 && callback(x, y)) return true
			}
			if (callback(y1, y2)) return true
		}
		return false
	}

	public normalize(): Line {
		if (this.p1.lessEqual(this.p2)) {
			return new Line(this.p1, this.p2)
		} else {
			return new Line(this.p2, this.p1)
		}
	}

	public get length(): number {
		return Math.sqrt((this.p1.x - this.p2.x) ** 2 + (this.p1.y - this.p2.y) ** 2)
	}

	public get skew(): boolean {
		return this.p1.x !== this.p2.x && this.p1.y !== this.p2.y
	}

	public get vertical(): boolean {
		return this.p1.x === this.p2.x
	}

	public get horizontal(): boolean {
		return this.p1.y === this.p2.y
	}

	public get values(): SquareTuple {
		return [this.p1.x, this.p1.y, this.p2.x, this.p2.y] as SquareTuple
	}

	public get hash(): hash {
		const lt = new Point(Math.min(this.p1.x, this.p2.x), Math.min(this.p1.y, this.p2.y))
		const rb = new Point(Math.max(this.p1.x, this.p2.x), Math.max(this.p1.y, this.p2.y))
		return `${lt.hash}-${rb.hash}`
	}

	public get desc(): string {
		const dirStr = this.vertical ? '|' : this.horizontal ? '-' : 'x'
		return `Line[${this.p1.desc}-${this.p2.desc}] (${dirStr})`
	}
}

/**
 * Vector class for 2D applications.
 * @param vx the x component of the vector.
 * @param vy the y component of the vector.
 */
export class Vector implements IComparable, IHashable, IPrintable, ICloneable<Vector> {
	constructor(public vx: number = 0, public vy: number = 0) { }

	static zero(): Vector {
		return new Vector(0, 0)
	}

	static fromPoints(p1: Point, p2: Point): Vector {
		return new Vector(p2.x - p1.x, p2.y - p1.y)
	}

	public plus(v: Vector): Vector {
		this.vx = this.vx + v.vx
		this.vy = this.vy + v.vy
		return this
	}

	static plus(v1: Vector, v2: Vector): Vector {
		return new Vector(v1.vx + v2.vx, v1.vy + v2.vy)
	}

	public minus(v: Vector): Vector {
		this.vx = this.vx - v.vx
		this.vy = this.vy - v.vy
		return this
	}

	static minus(v1: Vector, v2: Vector): Vector {
		return new Vector(v1.vx - v2.vx, v1.vy - v2.vy)
	}

	public dot(v: Vector): number {
		return this.vx * v.vx + this.vy * v.vy
	}

	public cross(v: Vector): number {
		return this.vx * v.vy - this.vy * v.vx
	}

	public reverse(): Vector {
		this.vx = -this.vx
		this.vy = -this.vy
		return this
	}

	static reverse(v: Vector): Vector {
		return new Vector(-v.vx, -v.vy)
	}

	public times(v: number): Vector {
		this.vx = this.vx * v
		this.vy = this.vy * v
		return this
	}

	static times(v: Vector, factor: number): Vector {
		return new Vector(v.vx * factor, v.vy * factor)
	}

	public divide(v: number): Vector {
		this.vx = this.vx / v
		this.vy = this.vy / v
		return this
	}

	static divide(v: Vector, factor: number): Vector {
		return new Vector(v.vx / factor, v.vy / factor)
	}

	public equals(v: Vector): boolean {
		return this.vx === v.vx && this.vy === v.vy
	}

	public parallel(v: Vector): boolean {
		return Math.abs(this.vx * v.vy - this.vy * v.vx) < 1e-6
	}

	/**
	 * Get the normalized vector.
	 * @returns the normalized vector.
	 */
	public normalize(): Vector {
		const length = this.length
		if (length === 0) {
			this.vx = 0
			this.vy = 0
		}
		this.vx = this.vx / length
		this.vy = this.vy / length
		return this
	}

	static normalize(v: Vector): Vector {
		const length = v.length
		if (length === 0) return Vector.zero()
		return new Vector(v.vx / length, v.vy / length)
	}

	public clone(): Vector {
		return new Vector(this.vx, this.vy)
	}

	public get direction(): number {
		return Math.atan2(this.vy, this.vx)
	}

	public get normalDir(): Direction {
		if (Math.abs(this.vx) >= Math.abs(this.vy)) {
			return this.vx >= 0 ? Direction.RIGHT : Direction.LEFT
		} else {
			return this.vy >= 0 ? Direction.DOWN : Direction.UP
		}
	}

	public get length(): number {
		return Math.sqrt(this.vx * this.vx + this.vy * this.vy)
	}

	public get angle(): number {
		return Math.atan2(this.vy, this.vx)
	}

	public get values(): PairTuple {
		return [this.vx, this.vy] as PairTuple
	}

	public get hash(): string {
		return String(this.vx) + '-' + String(this.vy)
	}

	public get desc(): string {
		return `Vector(${this.vx.toFixed(2)}, ${this.vy.toFixed(2)})`
	}
}

/**
 * Rect class for 2D applications.
 * @param pos the position of the rect.
 * @param size the size of the rect.
 */
export class Rect implements IComparable, IHashable, IPrintable, ICloneable<Rect> {
	constructor(public pos: Point = new Point(), public size: Size = new Size()) { }

	/**
	 * Create a rect from a square tuple.
	 * @param left the distance from the left edge to the left edge of the rect.
	 * @param top the distance from the top edge to the top edge of the rect.
	 * @param right the distance from the left edge to the right edge of the rect.
	 * @param bottom the distance from the top edge to the bottom edge of the rect.
	 * @return the new rect.
	 */
	static fromLTRB(left: number, top: number, right: number, bottom: number): Rect {
		return new Rect(new Point(left, top), new Size(right - left, bottom - top))
	}

	static fromLTWH(left: number, top: number, width: number, height: number): Rect {
		return new Rect(new Point(left, top), new Size(width, height))
	}

	/**
	 * Create a rect from two points.
	 * @param p1 the first point.
	 * @param p2 the second point.
	 * @return the new rect.
	 */
	static fromVertices(p1: Point, p2: Point): Rect {
		const left = Math.min(p1.x, p2.x)
		const top = Math.min(p1.y, p2.y)
		const right = Math.max(p1.x, p2.x)
		const bottom = Math.max(p1.y, p2.y)
		return Rect.fromLTRB(left, top, right, bottom)
	}

	/**
	 * Create a rect which has zero size and position.
	 * @return the new rect.
	 */
	static zero(): Rect {
		return new Rect(Point.zero(), new Size())
	}

	/**
	 * Linear interpolation between two rects.
	 * @param r The rect to interpolate to.
	 * @param factor The interpolation factor.
	 * @returns the interpolated rect.
	 */
	static lerp(r1: Rect, r2: Rect, factor: number): Rect {
		return new Rect(
			Point.lerp(r1.pos, r2.pos, factor),
			Size.lerp(r1.size, r2.size, factor)
		)
	}

	public home(): Rect {
		this.pos.x = 0
		this.pos.y = 0
		return this
	}

	static home(r: Rect): Rect {
		return new Rect(Point.zero(), r.size)
	}

	public isZero(): boolean {
		return this.pos.isZero() && this.size.isZero()
	}

	public shrink(): Rect {
		const bottomRight = Point.floor(this.bottomRight)
		this.pos.ceil()
		this.size.width = bottomRight.x - this.pos.x
		this.size.height = bottomRight.y - this.pos.y
		return this
	}

	static shrink(r: Rect): Rect {
		return Rect.fromVertices(
			Point.ceil(r.topLeft),
			Point.floor(r.bottomRight)
		)
	}

	/**
	 * Shift the rect by a vector.
	 * @param v the vector to shift the rect.
	 * @return the shifted rect.
	 */
	public shift(v: Vector): Rect {
		this.pos.shift(v)
		return this
	}

	static shift(r: Rect, v: Vector): Rect {
		return new Rect(Point.shift(r.pos, v), r.size.clone())
	}

	public float(): Rect {
		this.pos.float()
		const bottomRight = Point.float(this.bottomRight)
		this.size.width = bottomRight.x - this.pos.x
		this.size.height = bottomRight.y - this.pos.y
		return this
	}

	static float(r: Rect): Rect {
		const res = new Rect(Point.float(r.pos), r.size.clone())
		res.right = Math.round(res.right) + 0.5
		res.bottom = Math.round(res.bottom) + 0.5
		return res
	}

	public round(): Rect {
		this.pos.round()
		const bottomRight = Point.round(this.bottomRight)
		this.size.width = bottomRight.x - this.pos.x
		this.size.height = bottomRight.y - this.pos.y
		return this
	}

	static round(r: Rect): Rect {
		const res = new Rect(Point.round(r.pos), r.size.clone())
		res.right = Math.round(res.right)
		res.bottom = Math.round(res.bottom)
		return res
	}

	public scale(factor: number, center: Point = Point.zero()): Rect {
		this.pos.scale(factor, center)
		this.size.scale(factor)
		return this
	}

	static scale(r: Rect, factor: number, center: Point = Point.zero()): Rect {
		return new Rect(
			Point.scale(r.pos, factor, center),
			Size.scale(r.size, factor)
		)
	}

	public moveTo(p: Point): boolean {
		if (this.pos.equals(p)) return false
		this.pos = p
		return true
	}

	static setCenter(r: Rect, t: Point): Rect {
		return new Rect(
			new Point(t.x - r.width / 2, t.y - r.height / 2),
			r.size.clone()
		)
	}

	public fitWidthTo(width: number, centered: boolean = true): Rect {
		if (centered) {
			this.pos.x -= (width - this.size.width) / 2
		}
		this.size.width = width
		return this
	}

	public fitHeightTo(height: number, centered: boolean = true): Rect {
		if (centered) {
			this.pos.y -= (height - this.size.height) / 2
		}
		this.size.height = height
		return this
	}

	static resizeToIncludeBy(r: Rect, aspectPos: Point, newVert: Point): Rect {
		let res: Rect
		if (aspectPos.x <= r.left) {
			if (aspectPos.y <= r.top) {
				res = Rect.fromVertices(newVert, r.bottomRight)
			} else if (aspectPos.y >= r.bottom) {
				res = Rect.fromVertices(newVert, r.topRight)
			} else {
				res = Rect.fromVertices(r.bottomRight, r.topRight)
				res.expandToInclude(newVert)
			}
		} else if (aspectPos.x >= r.right) {
			if (aspectPos.y <= r.top) {
				res = Rect.fromVertices(newVert, r.bottomLeft)
			} else if (aspectPos.y >= r.bottom) {
				res = Rect.fromVertices(newVert, r.topLeft)
			} else {
				res = Rect.fromVertices(r.bottomLeft, r.topLeft)
				res.expandToInclude(newVert)
			}
		} else {
			if (aspectPos.y <= r.top) {
				res = Rect.fromVertices(r.bottomLeft, r.bottomRight)
				res.expandToInclude(newVert)
			} else if (aspectPos.y >= r.bottom) {
				res = Rect.fromVertices(r.topLeft, r.topRight)
				res.expandToInclude(newVert)
			} else {
				res = r.clone()
			}
		}
		return res
	}

	public resizeToIncludeBy(aspectPos: Point, newVert: Point): Rect {
		const res = Rect.resizeToIncludeBy(this, aspectPos, newVert)
		this.pos = res.pos
		this.size = res.size
		return this
	}

	/**
	 * Expand, or shrink if val is negative, the rect by a padding value.
	 * @param val the padding value.
	 * @return the padded rect.
	 */
	public padding(val: number): Rect {
		this.pos.x -= val
		this.pos.y -= val
		this.size.width += 2 * val
		this.size.height += 2 * val
		return this
	}

	static padding(r: Rect, val: number): Rect {
		return new Rect(
			new Point(r.pos.x - val, r.pos.y - val),
			new Size(r.size.width + 2 * val, r.size.height + 2 * val)
		)
	}

	/**
	 * Expand the rect to include a point.
	 * @param p the point to include.
	 * @return the expanded rect.
	 */
	public expandToInclude(p: Point): Rect {
		const r = Rect.expandToInclude(this, p)
		this.pos = r.pos
		this.size = r.size
		return this
	}

	static expandToInclude(r: Rect, p: Point): Rect {
		const left = Math.min(r.left, p.x)
		const top = Math.min(r.top, p.y)
		const right = Math.max(r.right, p.x)
		const bottom = Math.max(r.bottom, p.y)
		return Rect.fromLTRB(left, top, right, bottom)
	}

	public clone(): Rect {
		return new Rect(this.pos.clone(), this.size.clone())
	}

	public get left(): number { return this.pos.x }
	public set left(value: number) { this.pos.x = value }

	public get right(): number { return this.pos.x + this.size.width }
	public set right(value: number) { this.size.width = value - this.pos.x }

	public get top(): number { return this.pos.y }
	public set top(value: number) { this.pos.y = value }

	public get bottom(): number { return this.pos.y + this.size.height }
	public set bottom(value: number) { this.size.height = value - this.pos.y }

	public get width(): number { return this.size.width }
	public set width(value: number) { this.size.width = value }

	public get height(): number { return this.size.height }
	public set height(value: number) { this.size.height = value }

	public get centerX(): number { return this.pos.x + this.size.width / 2 }
	public get centerY(): number { return this.pos.y + this.size.height / 2 }
	public get center(): Point { return new Point(this.centerX, this.centerY) }
	public set center(p: Point) {
		this.pos = new Point(p.x - this.size.width / 2, p.y - this.size.height / 2)
	}

	public get topLeft(): Point { return this.pos }
	public get topRight(): Point { return new Point(this.right, this.top) }
	public get bottomLeft(): Point { return new Point(this.left, this.bottom) }
	public get bottomRight(): Point { return new Point(this.right, this.bottom) }

	public get topCenter(): Point { return new Point(this.centerX, this.top) }
	public get rightCenter(): Point { return new Point(this.right, this.centerY) }
	public get bottomCenter(): Point { return new Point(this.centerX, this.bottom) }
	public get leftCenter(): Point { return new Point(this.left, this.centerY) }

	public set topCenter(p: Point) { this.pos.x = p.x - this.size.width / 2; this.pos.y = p.y }
	public set rightCenter(p: Point) { this.pos.x = p.x - this.size.width; this.pos.y = p.y - this.size.height / 2 }
	public set bottomCenter(p: Point) { this.pos.x = p.x - this.size.width / 2; this.pos.y = p.y - this.size.height }
	public set leftCenter(p: Point) { this.pos.x = p.x; this.pos.y = p.y - this.size.height / 2 }

	public get corners(): Point[] {
		return [this.topLeft, this.topRight, this.bottomRight, this.bottomLeft]
	}

	public get edges(): Line[] {
		return [
			new Line(this.topLeft, this.topRight),
			new Line(this.topRight, this.bottomRight),
			new Line(this.bottomRight, this.bottomLeft),
			new Line(this.bottomLeft, this.topLeft)
		]
	}

	public get edgeCenters(): Point[] {
		return [
			new Point(this.centerX, this.top),
			new Point(this.right, this.centerY),
			new Point(this.centerX, this.bottom),
			new Point(this.left, this.centerY)
		]
	}

	public times(factor: number): Rect {
		this.pos.times(factor)
		this.size.times(factor)
		return this
	}

	static times(r: Rect, factor: number): Rect {
		return new Rect(
			Point.times(r.pos, factor),
			Size.times(r.size, factor)
		)
	}

	/**
	 * Judge whether the point given is in the rect.
	 * @param point the given point.
	 * @returns true if the point is in the rect.
	 */
	public containsPoint(point: Point): boolean {
		return point.x >= this.left &&
			point.x <= this.right &&
			point.y >= this.top &&
			point.y <= this.bottom
	}

	public includesPoint(point: Point): boolean {
		return point.x > this.left &&
			point.x < this.right &&
			point.y > this.top &&
			point.y < this.bottom
	}

	/**
	 * Judge whether the line given is in the rect.
	 * @param line the given line.
	 * @returns true if the line is in the rect.
	 */
	public containsLine(line: Line): boolean {
		return this.containsPoint(line.p1) && this.containsPoint(line.p2)
	}

	public pointOnEdge(point: Point): boolean {
		return this.edges.some(edge => edge.contains(point))
	}

	public pointOnEdges(point: Point): Line[] {
		return this.edges.filter(edge => edge.contains(point))
	}

	/**
	 * Judge whether the rect given is in the rect.
	 * @param rect the given rect.
	 * @returns true if the rect is in the rect.
	 */
	public containsRect(rect: Rect): boolean {
		return rect.left >= this.left &&
			rect.right <= this.right &&
			rect.top >= this.top &&
			rect.bottom <= this.bottom
	}

	public intersectsLine(line: Line): boolean {
		return line.some(
			(x, y) => this.containsPoint(new Point(x, y))
		)
	}

	/**
	 * Judge whether the rect given intersects the rect.
	 * @param rect the given rect.
	 * @returns true if the rect intersects the rect.
	 */
	public intersectsRect(rect: Rect): boolean {
		return this.left <= rect.right &&
			this.right >= rect.left &&
			this.top <= rect.bottom &&
			this.bottom >= rect.top
	}

	/**
	 * Get the intersection of the current rect and the another rect.
	 * @param rect the another rect.
	 * @returns the intersection element.
	 */
	public intersection(rect: Rect): Element {
		const left = Math.max(this.left, rect.left)
		const right = Math.min(this.right, rect.right)
		if (left > right) return null // No intersection.
		const top = Math.max(this.top, rect.top)
		const bottom = Math.min(this.bottom, rect.bottom)
		if (top > bottom) return null // No intersection.
		if (left === right && top === bottom) return new Point(left, top)
		if (left === right) return new Line(new Point(left, top), new Point(left, bottom))
		if (top === bottom) return new Line(new Point(left, top), new Point(right, top))
		return Rect.fromLTRB(left, top, right, bottom)
	}

	/**
	 * Get the union of the current rect and the another rect.
	 * @param rect the another rect.
	 * @returns the union.
	 */
	public union(rect: Rect): Rect {
		const left = Math.min(this.left, rect.left)
		const top = Math.min(this.top, rect.top)
		const right = Math.max(this.right, rect.right)
		const bottom = Math.max(this.bottom, rect.bottom)
		this.pos.x = left
		this.pos.y = top
		this.size.width = right - left
		this.size.height = bottom - top
		return this
	}

	static union(r1: Rect, r2: Rect): Rect {
		const left = Math.min(r1.left, r2.left)
		const top = Math.min(r1.top, r2.top)
		const right = Math.max(r1.right, r2.right)
		const bottom = Math.max(r1.bottom, r2.bottom)
		return Rect.fromLTRB(left, top, right, bottom)
	}

	static unionAll(rects: Rect[]): Rect {
		if (rects.length === 0) return Rect.zero()
		let res = rects[0]
		for (let i = 1; i < rects.length; i++) {
			res = Rect.union(res, rects[i])
		}
		return res
	}

	/**
	 * Get the aspect of the current rect and the another rect.
	 * @param rect the another rect.
	 * @returns
	 * 't' if the current rect is on the top of the another rect.
	 * 'b' if the current rect is on the bottom of the another rect.
	 * 'l' if the current rect is on the left of the another rect.
	 * 'r' if the current rect is on the right of the another rect.
	 * 'c' if the current rect is in the center of the another rect.
	   */
	public relativeAspectTo(rect: Rect): string {
		let res = ''
		const inter = this.intersection(rect)
		if (inter && inter instanceof Rect) {
			if (inter.equals(rect) || inter.equals(this)) return 'c'
			res += this.left > rect.left ? 'r' : 'l'
			res += this.top > rect.top ? 'b' : 't'
		} else {
			res += this.left > rect.right ? 'r' : ''
			res += this.right < rect.left ? 'l' : ''
			res += this.top > rect.bottom ? 'b' : ''
			res += this.bottom < rect.top ? 't' : ''
		}
		return res
	}

	// ew ns nesw nwse to represent the relative direction
	public posRelativeResizeDirection(pos: Point): string {
		if (pos.x <= this.left) {
			if (pos.y <= this.top) return 'nwse'
			if (pos.y >= this.bottom) return 'nesw'
			return 'ew'
		} else if (pos.x >= this.right) {
			if (pos.y <= this.top) return 'nesw'
			if (pos.y >= this.bottom) return 'nwse'
			return 'ew'
		} else {
			return 'ns'
		}
	}

	public equals(rect: Rect): boolean {
		return this.pos.equals(rect.pos) && this.size.equals(rect.size)
	}

	/**
	 * For each point in the rect, call the callback function.
	 * @param callback the callback function.
	 * @param step the step of the iteration.
	 */
	public forEach(callback: (x: number, y: number) => void, step = 1) {
		const { left, right, top, bottom } = this
		for (let x = left; x <= right; x += step) {
			for (let y = top; y <= bottom; y += step) {
				callback(x, y)
			}
		}
		// Check if the right and bottom edges are not included in the iteration.
		// If not, add them to the iteration.
		if (this.width % step !== 0) {
			for (let y = top; y <= bottom; y += step) {
				callback(right, y)
			}
		}
		if (this.height % step !== 0) {
			for (let x = left; x <= right; x += step) {
				callback(x, bottom)
			}
		}
		callback(right, bottom)
	}

	/**
	 * For each point in the rect, call the callback function.
	 * If the callback function returns true, stop the iteration.
	 * @notice The iteration will stop if the callback function returns true.
	 * Just like the Array.some() method. Compared to the forEach() method,
	 * this method is more efficient.
	 * @param callback the callback function.
	 * @param step the step of the iteration.
	 * @return true if the callback function returns true.
	 */
	public some(callback: (x: number, y: number) => boolean, step = 1): boolean {
		const { left, right, top, bottom } = this
		// First check the four corners.
		if (
			callback(left, top) ||
			callback(left, bottom) ||
			callback(right, top) ||
			callback(right, bottom)
		) return true
		// Then check the four edges.
		for (let x = left + step; x < right; x += step) {
			if (callback(x, top) || callback(x, bottom)) return true
		}
		for (let y = top + step; y < bottom; y += step) {
			if (callback(left, y) || callback(right, y)) return true
		}
		// Finally check the inner points.
		for (let x = left + step; x < right; x += step) {
			for (let y = top + step; y < bottom; y += step) {
				if (callback(x, y)) return true
			}
		}
		return false
	}

	public get ltwh(): SquareTuple {
		return [this.pos.x, this.pos.y, this.size.width, this.size.height] as SquareTuple
	}

	public get ltrb(): SquareTuple {
		return [this.pos.x, this.pos.y, this.pos.x + this.size.width, this.pos.y + this.size.height] as SquareTuple
	}

	public get hash(): hash {
		return String(this.pos.hash) + '|' + String(this.size.hash)
	}

	public get desc(): string {
		return `Rect{(${this.pos.x.toFixed(2)
			}, ${this.pos.y.toFixed(2)
			}), [${this.size.width.toFixed(2)
			}, ${this.size.height.toFixed(2)
			}]}`
	}
}

export class Bound implements IComparable, IHashable, IPrintable, ICloneable<Bound> {
	constructor(public lftLmt: number | null = null, public rgtLmt: number | null = null) {
		if (lftLmt !== null && rgtLmt !== null && lftLmt > rgtLmt) {
			throw new Error('Bound: Left limit must be less than right limit')
		}
	}

	public clone(): Bound {
		return new Bound(this.lftLmt, this.rgtLmt)
	}

	/**
	 * Restrict the given value to the bound. 
	 * If the value is less than the left limit, the left limit will be returned.
	 * If the value is greater than the right limit, the right limit will be returned.
	 * Otherwise, the value itself will be returned.
	 * @param value Value to be restricted.
	 * @returns Restricted value.
	 */
	public restrict(value: number): number {
		if (this.lftLmt !== null && value < this.lftLmt) {
			return this.lftLmt
		}
		if (this.rgtLmt !== null && value > this.rgtLmt) {
			return this.rgtLmt
		}
		return value
	}

	/**
	 * Set left limit to the maximum of the current value and the given value.
	 * @param value Value to compare with the current left limit.
	 */
	public maxLft(value: number): void {
		if (this.lftLmt === null || value > this.lftLmt) {
			this.lftLmt = value
		}
	}

	/**
	 * Set right limit to the maximum of the current value and the given value.
	 * @param value Value to compare with the current right limit.
	 * @returns 
	 */
	public maxRgt(value: number): void {
		if (this.rgtLmt === null) return
		if (value > this.rgtLmt) {
			this.rgtLmt = value
		}
	}

	/**
	 * Set left limit to the minimum of the current value and the given value.
	 * @param value Value to compare with the current left limit.
	 */
	public minLft(value: number): void {
		if (this.lftLmt === null) return
		if (value < this.lftLmt) {
			this.lftLmt = value
		}
	}

	/**
	 * Set right limit to the minimum of the current value and the given value.
	 * @param value Value to compare with the current right limit.
	 */
	public minRgt(value: number): void {
		if (this.rgtLmt === null || value < this.rgtLmt) {
			this.rgtLmt = value
		}
	}

	public equals(b: Bound): boolean {
		return this.lftLmt === b.lftLmt && this.rgtLmt === b.rgtLmt
	}

	public get values(): [number | null, number | null] {
		return [this.lftLmt, this.rgtLmt]
	}

	public get hash(): string {
		return `${this.lftLmt},${this.rgtLmt}`
	}

	public get desc(): string {
		return `Bound{${this.lftLmt?.toFixed(2)}, ${this.rgtLmt?.toFixed(2)}}`
	}
}

export class PointBound implements IComparable, IPrintable, ICloneable<PointBound> {
	constructor(public x: Bound, public y: Bound) { }

	public clone(): PointBound {
		return new PointBound(this.x.clone(), this.y.clone())
	}

	/**
	 * Restrict the given point to the bound.
	 * @param point Point to be restricted.
	 * @returns Restricted point.
	 */
	public restrict(point: Point): Point {
		return new Point(this.x.restrict(point.x), this.y.restrict(point.y))
	}

	public maxLft(point: Point): void {
		this.x.maxLft(point.x)
		this.y.maxLft(point.y)
	}

	public maxRgt(point: Point): void {
		this.x.maxRgt(point.x)
		this.y.maxRgt(point.y)
	}

	public minLft(point: Point): void {
		this.x.minLft(point.x)
		this.y.minLft(point.y)
	}

	public minRgt(point: Point): void {
		this.x.minRgt(point.x)
		this.y.minRgt(point.y)
	}

	public equals(b: PointBound): boolean {
		return this.x.equals(b.x) && this.y.equals(b.y)
	}

	public get desc(): string {
		return `PointBound(${this.x.desc}, ${this.y.desc})`
	}
}

export class SizeBound implements IComparable, IPrintable, ICloneable<SizeBound> {
	constructor(public width: Bound, public height: Bound) { }

	public clone(): SizeBound {
		return new SizeBound(this.width.clone(), this.height.clone())
	}

	public restrict(size: Size): Size {
		return new Size(this.width.restrict(size.width), this.height.restrict(size.height))
	}

	public maxLft(size: Size): void {
		this.width.maxLft(size.width)
		this.height.maxLft(size.height)
	}

	public maxRgt(size: Size): void {
		this.width.maxRgt(size.width)
		this.height.maxRgt(size.height)
	}

	public minLft(size: Size): void {
		this.width.minLft(size.width)
		this.height.minLft(size.height)
	}

	public minRgt(size: Size): void {
		this.width.minRgt(size.width)
		this.height.minRgt(size.height)
	}

	public equals(b: SizeBound): boolean {
		return this.width.equals(b.width) && this.height.equals(b.height)
	}

	public get desc(): string {
		return `SizeBounds[${this.width}, ${this.height}]`
	}
}

export class RectBound {
	private _lftBound: Bound
	private _rgtBound: Bound
	private _topBound: Bound
	private _btmBound: Bound

	constructor(boundRect: Rect, sizeFixed = false) {
		const { width, height } = boundRect.size
		const { left, right, top, bottom } = boundRect
		if (sizeFixed) {
			this._lftBound = new Bound(left, right - width)
			this._rgtBound = new Bound(left + width, right)
			this._topBound = new Bound(top, bottom - height)
			this._btmBound = new Bound(top + height, bottom)
		} else {
			this._lftBound = new Bound(left, right)
			this._rgtBound = this._lftBound
			this._topBound = new Bound(top, bottom)
			this._btmBound = this._topBound
		}
	}

	public restrict(rect: Rect): Rect {
		return Rect.fromLTRB(
			this._lftBound.restrict(rect.left),
			this._topBound.restrict(rect.top),
			this._rgtBound.restrict(rect.right),
			this._btmBound.restrict(rect.bottom)
		)
	}
}