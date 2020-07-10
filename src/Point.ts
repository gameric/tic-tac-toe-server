import { IPoint } from "./types";

export class Point implements IPoint {
  constructor(public x: number, public y: number) {}

  add(p: IPoint): Point {
    return new Point(this.x + p.x, this.y + p.y);
  }

  subtract(p: IPoint): Point {
    return new Point(this.x - p.x, this.y - p.y);
  }

  equals(p: IPoint): boolean {
    return this.x == p.x && this.y == p.y;
  }

  static negative(p: IPoint): IPoint {
    return { x: -p.x, y: -p.y };
  }
}
