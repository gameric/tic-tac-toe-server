export interface IPoint {
  x: number;
  y: number;
}

export enum PLAYER {
  X = "X",
  O = "O",
}

export interface IWinState {
  isTie: boolean;
  winner: string;
}

export interface IGameState extends IWinState {
  room: string;
  char: PLAYER;
  turn: PLAYER;
  board: string[][];
  gameOver: boolean;
  winner: string;
}

export interface ITileClickedEvent {
  room: string;
  location: IPoint;
  char: PLAYER;
}
