type PairTuple = readonly [number, number];
type SquareTuple = readonly [number, number, number, number];

export class Size {
	constructor(public width: number = 0, public height: number = 0) { }

	clone(): Size {
		return new Size(this.width, this.height);
	}

	values(): PairTuple {
		return [this.width, this.height] as PairTuple;
	}
}

export class Point {
	constructor(public x: number = 0, public y: number = 0) { }

	static zero(): Point {
		return new Point(0, 0);
	}

	clone(): Point {
		return new Point(this.x, this.y);
	}

	values(): PairTuple {
		return [this.x, this.y] as PairTuple;
	}
}

export class Vector {
	constructor(public vx: number = 0, public vy: number = 0) { }

	static zero(): Vector {
		return new Vector(0, 0);
	}

	plus(v: Vector): Vector {
		return new Vector(this.vx + v.vx, this.vy + v.vy);
	}

	minus(v: Vector): Vector {
		return new Vector(this.vx - v.vx, this.vy - v.vy);
	}

	multiply(v: Vector): Vector {
		return new Vector(this.vx * v.vx, this.vy * v.vy);
	}

	divide(v: Vector): Vector {
		return new Vector(this.vx / v.vx, this.vy / v.vy);
	}

	equals(v: Vector): boolean {
		return this.vx === v.vx && this.vy === v.vy;
	}

	direction(): number {
		return Math.atan2(this.vy, this.vx);
	}

	length(): number {
		return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
	}

	normalize(): Vector {
		const length = this.length();
		if (length === 0) {
			return Vector.zero();
		}
		return new Vector(this.vx / length, this.vy / length);
	}

	clone(): Vector {
		return new Vector(this.vx, this.vy);
	}

	toString(): string {
		return `Vector (${this.vx}, ${this.vy})`;
	}

	values(): PairTuple {
		return [this.vx, this.vy] as PairTuple;
	}
}

export class Rect {
	constructor(public pos: Point = new Point(), public size: Size = new Size()) { }

	static fromLTRB(left: number, top: number, right: number, bottom: number): Rect {
		return new Rect(new Point(left, top), new Size(right - left, bottom - top));
	}

	static zero(): Rect {
		return new Rect(Point.zero(), new Size());
	}

	clone(): Rect {
		return new Rect(this.pos.clone(), this.size.clone());
	}

	get left(): number { return this.pos.x }
	set left(value: number) { this.pos.x = value }

	get right(): number { return this.pos.x + this.size.width }
	set right(value: number) { this.size.width = value - this.pos.x }

	get top(): number { return this.pos.y }
	set top(value: number) { this.pos.y = value }

	get bottom(): number { return this.pos.y + this.size.height }
	set bottom(value: number) { this.size.height = value - this.pos.y }

	get width(): number { return this.size.width }
	set width(value: number) { this.size.width = value }

	get height(): number { return this.size.height }
	set height(value: number) { this.size.height = value }

	get centerX(): number { return this.pos.x + this.size.width / 2 }
	get centerY(): number { return this.pos.y + this.size.height / 2 }
	get center(): Point { return new Point(this.centerX, this.centerY) }

	get leftTop(): Point { return this.pos }
	get rightTop(): Point { return new Point(this.right, this.top) }
	get leftBottom(): Point { return new Point(this.left, this.bottom) }
	get rightBottom(): Point { return new Point(this.right, this.bottom) }

	containsPoint(point: Point): boolean {
		return point.x >= this.left && point.x <= this.right && point.y >= this.top && point.y <= this.bottom;
	}

	containsRect(rect: Rect): boolean {
		return rect.left >= this.left && rect.right <= this.right && rect.top >= this.top && rect.bottom <= this.bottom;
	}

	intersectsRect(rect: Rect): boolean {
		return this.left < rect.right && this.right > rect.left && this.top < rect.bottom && this.bottom > rect.top;
	}

	intersection(rect: Rect): Rect {
		const left = Math.max(this.left, rect.left);
		const top = Math.max(this.top, rect.top);
		const right = Math.min(this.right, rect.right);
		const bottom = Math.min(this.bottom, rect.bottom);
		return Rect.fromLTRB(left, top, right, bottom);
	}

	union(rect: Rect): Rect {
		const left = Math.min(this.left, rect.left);
		const top = Math.min(this.top, rect.top);
		const right = Math.max(this.right, rect.right);
		const bottom = Math.max(this.bottom, rect.bottom);
		return Rect.fromLTRB(left, top, right, bottom);
	}

	toString(): string {
		return `Rect (${this.pos.x}, ${this.pos.y}) [${this.size.width}, ${this.size.height}]`;
	}

	values(): SquareTuple {
		return [this.pos.x, this.pos.y, this.size.width, this.size.height] as SquareTuple;
	}

	ltrb(): SquareTuple {
		return [this.pos.x, this.pos.y, this.pos.x + this.size.width, this.pos.y + this.size.height] as SquareTuple;
	}
}

export class Bound {
	constructor(public lftLmt: number | null = null, public rgtLmt: number | null = null) {
		if (lftLmt !== null && rgtLmt !== null && lftLmt > rgtLmt) {
			throw new Error('Bound: Left limit must be less than right limit');
		}
	}

	clone(): Bound {
		return new Bound(this.lftLmt, this.rgtLmt);
	}

	restrict(value: number): number {
		if (this.lftLmt !== null && value < this.lftLmt) {
			return this.lftLmt;
		}
		if (this.rgtLmt !== null && value > this.rgtLmt) {
			return this.rgtLmt;
		}
		return value;
	}

	maxLft(value: number): void {
		if (this.lftLmt === null || value > this.lftLmt) {
			this.lftLmt = value;
		}
	}

	maxRgt(value: number): void {
		if (this.rgtLmt === null) return;
		if (value > this.rgtLmt) {
			this.rgtLmt = value;
		}
	}

	minLft(value: number): void {
		if (this.lftLmt === null) return;
		if (value < this.lftLmt) {
			this.lftLmt = value;
		}
	}

	minRgt(value: number): void {
		if (this.rgtLmt === null || value < this.rgtLmt) {
			this.rgtLmt = value;
		}
	}

	equals(b: Bound): boolean {
		return this.lftLmt === b.lftLmt && this.rgtLmt === b.rgtLmt;
	}

	toString(): string {
		return `Bounds (${this.lftLmt}, ${this.rgtLmt})`;
	}

	values(): [number | null, number | null] {
		return [this.lftLmt, this.rgtLmt];
	}
}

export class PointBound {
	constructor(public x: Bound, public y: Bound) { }

	clone(): PointBound {
		return new PointBound(this.x.clone(), this.y.clone());
	}

	restrict(point: Point): Point {
		return new Point(this.x.restrict(point.x), this.y.restrict(point.y));
	}

	maxLft(point: Point): void {
		this.x.maxLft(point.x);
		this.y.maxLft(point.y);
	}

	maxRgt(point: Point): void {
		this.x.maxRgt(point.x);
		this.y.maxRgt(point.y);
	}

	minLft(point: Point): void {
		this.x.minLft(point.x);
		this.y.minLft(point.y);
	}

	minRgt(point: Point): void {
		this.x.minRgt(point.x);
		this.y.minRgt(point.y);
	}

	equals(b: PointBound): boolean {
		return this.x.equals(b.x) && this.y.equals(b.y);
	}

	toString(): string {
		return `PointBounds (${this.x}, ${this.y})`;
	}
}

export class SizeBound {
	constructor(public width: Bound, public height: Bound) { }

	clone(): SizeBound {
		return new SizeBound(this.width.clone(), this.height.clone());
	}

	restrict(size: Size): Size {
		return new Size(this.width.restrict(size.width), this.height.restrict(size.height));
	}

	maxLft(size: Size): void {
		this.width.maxLft(size.width);
		this.height.maxLft(size.height);
	}

	maxRgt(size: Size): void {
		this.width.maxRgt(size.width);
		this.height.maxRgt(size.height);
	}

	minLft(size: Size): void {
		this.width.minLft(size.width);
		this.height.minLft(size.height);
	}

	minRgt(size: Size): void {
		this.width.minRgt(size.width);
		this.height.minRgt(size.height);
	}

	equals(b: SizeBound): boolean {
		return this.width.equals(b.width) && this.height.equals(b.height);
	}

	toString(): string {
		return `SizeBounds (${this.width}, ${this.height})`;
	}
}

export class RectBound {
	constructor(public pos: PointBound, public size: SizeBound) { }

	clone(): RectBound {
		return new RectBound(this.pos.clone(), this.size.clone());
	}

	restrict(rect: Rect): Rect {
		return new Rect(this.pos.restrict(rect.pos), this.size.restrict(rect.size));
	}

	maxLft(rect: Rect): void {
		this.pos.maxLft(rect.pos);
		this.size.maxLft(rect.size);
	}

	maxRgt(rect: Rect): void {
		this.pos.maxRgt(rect.pos);
		this.size.maxRgt(rect.size);
	}

	minLft(rect: Rect): void {
		this.pos.minLft(rect.pos);
		this.size.minLft(rect.size);
	}

	minRgt(rect: Rect): void {
		this.pos.minRgt(rect.pos);
		this.size.minRgt(rect.size);
	}

	equals(b: RectBound): boolean {
		return this.pos.equals(b.pos) && this.size.equals(b.size);
	}

	toString(): string {
		return `RectBounds (${this.pos}, ${this.size})`;
	}
}