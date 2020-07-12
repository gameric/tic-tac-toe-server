import cors from "cors";
import crypto from "crypto";
import express from "express";
import http from "http";
import socketIO from "socket.io";
import { ITileClickedEvent } from "tic-tac-toe-shared";
import { Game } from "./board";

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(cors());

const games: { [key: string]: Game } = {};
const playerRoom: { [key: string]: string } = {};

function getNumberOfPlayers(room: string) {
  return io.sockets.adapter.rooms[room]?.length || 0;
}

function notifyRoom(
  room: string,
  event: string,
  data: unknown = undefined
): void {
  io.sockets.to(room).emit(event, data);
}

io.on("connection", (socket) => {
  function createRoom(): string {
    const roomName = crypto.randomBytes(5).toString("hex");
    games[roomName] = new Game(roomName);
    return roomName;
  }

  socket.on("join-room", (room: string) => {
    const game = games[room];
    if (!game) return socket.emit("err", { message: "Invalid room" });

    const nPlayers = getNumberOfPlayers(room);

    if (nPlayers == 1) notifyRoom(room, "player-joined");
    else if (nPlayers == 2)
      return socket.emit("err", { message: "Room is full" });

    playerRoom[socket.id] = room;
    socket.join(room);
    game.addPlayer(socket.id);

    const state = game.getMyState(socket.id);

    socket.emit("joined-room", state);
  });

  socket.on("new-game", () => {
    const room = playerRoom[socket.id];
    if (!games[room].gameOver) return socket.send("Game is NOT over yet!");
    games[room].reMatch();
    notifyRoom(room, "new-game", games[room].getState());
  });

  socket.on("tile-clicked", ({ char, point }: ITileClickedEvent) => {
    const room = playerRoom[socket.id];
    const game = games[room];
    if (!game) return socket.emit("err", { message: "Invalid room" });
    try {
      const gameOver = game.play(char, point);
      if (gameOver) notifyRoom(room, "game-over", game.getWinState());
      notifyRoom(room, "tile-clicked", { char, point });
    } catch (err) {
      socket.emit("err", { message: err.message });
    }
  });

  socket.on("new-room", () => {
    const room = createRoom();
    const game = games[room];
    playerRoom[socket.id] = room;
    game.addPlayer(socket.id);
    socket.join(room);
    socket.emit("joined-room", game.getMyState(socket.id));
  });

  socket.on("disconnect", () => {
    const room = playerRoom[socket.id];
    const game = games[room];
    if (game) game.removePlayer(socket.id);
    if (getNumberOfPlayers(room) == 0) {
      delete games[room];
    }
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`listening on ${PORT}`));
