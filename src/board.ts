import { Point } from "./Point";
import { PLAYER, IWinState, IPoint, IGameState } from "./types";

const TOP_LEFT = new Point(0, 0);
const TOP_RIGHT = new Point(0, 2);
const CENTER_POINT = new Point(1, 1);

const EMPTY_TILE = "";

const getOpponent = (char: PLAYER): PLAYER =>
  char == PLAYER.X ? PLAYER.O : PLAYER.X;

export class Game {
  winner = "";
  moves = 0;
  turn: PLAYER = PLAYER.X;
  players: { [key: string]: PLAYER } = {};
  gameOver = false;

  board = Array.from({ length: 3 }, () =>
    Array.from({ length: 3 }, () => EMPTY_TILE)
  );

  constructor(private room: string) {}

  getWinState(): IWinState {
    return { isTie: this.winner === "", winner: this.winner };
  }

  getState(socketID: string): IGameState {
    return {
      turn: this.turn,
      board: this.board,
      gameOver: this.gameOver,
      room: this.room,
      char: this.getPlayerChar(socketID),
      ...this.getWinState(),
    };
  }

  removePlayer(socketID: string): void {
    delete this.players[socketID];
  }

  addPlayer(socketID: string): void {
    this.players[socketID] = this.getPlayerChar(socketID);
  }

  getPlayerChar(socketId: string): PLAYER {
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
    const direction = CENTER_POINT.subtract({ x, y });
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

    const isDiagonal = diagonalPoints.find((p) => playedPoint.equals(p));

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
