export interface IPoint {
  x: number;
  y: number;
}

export enum PLAYER {
  X = "X",
  O = "O",
}

const TOP_LEFT: IPoint = { x: 0, y: 0 };
const TOP_RIGHT: IPoint = { x: 0, y: 2 };
const CENTER_POINT: IPoint = { x: 1, y: 1 };

const EMPTY_TILE = "";

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

  static negative(p: IPoint) {
    return { x: -p.x, y: -p.y };
  }
}

function getOpponent(char: string) {
  return char == PLAYER.X ? PLAYER.O : PLAYER.X;
}

export class Game {
  winner = "";
  moves = 0;
  turn: PLAYER = PLAYER.X;
  players: { [key: string]: string } = {};
  gameOver = false;

  board = Array.from({ length: 3 }, () =>
    Array.from({ length: 3 }, () => EMPTY_TILE)
  );

  constructor() {}

  getWinState() {
    return { isTie: this.winner === "", winner: this.winner };
  }

  getState() {
    return {
      turn: this.turn,
      board: this.board,
      gameOver: this.gameOver,
      ...this.getWinState(),
    };
  }

  removePlayer(socketId: string) {
    delete this.players[socketId];
  }

  addPlayer(socketId: string) {
    this.players[socketId] = this.getPlayerChar(socketId);
  }

  getPlayerChar(socketId: string): string {
    console.log(this.players);
    console.log(socketId, this.players[socketId]);
    return this.players[socketId]
      ? this.players[socketId]
      : getOpponent(Object.values(this.players)[0]);
  }

  play(char: string, point: IPoint): boolean {
    if (!this.gameOver && this.turn === char && this.canPlayAt(point)) {
      this.board[point.x][point.y] = char;
      this.moves++;
      this.turn = getOpponent(char);
    } else {
      if (this.gameOver) throw new Error("GAME_OVER");
      if (this.turn !== char) throw new Error("NOT_YOUR_TURN");
      if (this.canPlayAt(point) === false) throw new Error("POINT_OCCUPIED");
    }

    if ((this.gameOver = this.isWinSitiuation(char, point))) {
      this.winner = char;
    }

    return (this.gameOver = this.gameOver || this.moves === 9);
  }

  canPlayAt({ x, y }: IPoint): boolean {
    return this.board[x][y] === EMPTY_TILE;
  }

  checkDiagonal({ x, y }: IPoint): boolean {
    const direction = new Point(CENTER_POINT.x, CENTER_POINT.y).subtract({
      x,
      y,
    });
    const char = this.board[x][y];
    let p = new Point(x, y);
    for (let i = 0; i < 3; i++) {
      if (this.board[p.x][p.y] !== char) return false;
      p = p.add(direction);
    }
    return true;
  }

  isWinSitiuation(char: string, { x, y }: IPoint): boolean {
    if (this.moves < 5) return false;
    let got3 = false;
    for (let i = 0; i < 3; i++) {
      if (this.board[x][i] === char) got3 = true;
      else {
        got3 = false;
        break;
      }
    }

    if (got3) return true;

    for (let i = 0; i < 3; i++) {
      if (this.board[i][y] === char) got3 = true;
      else {
        got3 = false;
        break;
      }
    }

    if (got3) return true;

    const diagonalPoints: IPoint[] = [
      { x: 0, y: 0 },
      { x: 2, y: 2 },
      { x: 0, y: 2 },
      { x: 2, y: 0 },
      CENTER_POINT,
    ];

    const playedPoint = new Point(x, y);

    const isDiagonal = diagonalPoints.find((p: IPoint) =>
      playedPoint.equals(p)
    );

    if (isDiagonal) {
      if (playedPoint.equals(CENTER_POINT)) {
        return this.checkDiagonal(TOP_LEFT) || this.checkDiagonal(TOP_RIGHT);
      } else {
        return this.checkDiagonal(playedPoint);
      }
    }

    return false;
  }
}

// a client connects
// without a room number
// he gets assigned a room number
// he gets added to the list of players in this room
// he gets assigned a char
//

// a client connects with a room number
// he gets assigned a room number
// he gets added to the list of players in this room
// now the game starts ()
// each player gets notified and player X starts
// we should keep track of whose turn is it
//

// when a player clicks a tile
// we emit the event to the room and each player updates his board
// we should also check if this is a win situation
// inform the players with the new move and the char of the player and if it is a win sitiuation
// the game keeps running until a win sitiuation is reached
