import socketIO from "socket.io";
import express from "express";
import http from "http";
import cors from "cors";
import crypto from "crypto";

import { Game, IPoint, PLAYER } from "./board";

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(cors());

const games: { [key: string]: Game } = {};
const playerRoom: { [key: string]: string } = {};

function getNumberOfPlayers(room: string) {
  return io.sockets.adapter.rooms[room]?.length || 0;
}

function createRoom(): string {
  const roomName = crypto.randomBytes(5).toString("hex");
  games[roomName] = new Game();
  return roomName;
}

function notifyRoom(room: string, event: string, data: any = undefined): void {
  io.sockets.to(room).emit(event, data);
}

io.on("connection", (socket) => {
  socket.on("join-room", (room) => {
    if (!games[room])
      return socket.emit("join-error", { message: "Invalid room" });

    const nPlayers = getNumberOfPlayers(room);

    if (nPlayers == 1) notifyRoom(room, "player-joined");
    else if (nPlayers == 2)
      return socket.emit("join-error", { message: "Room is full" });

    playerRoom[socket.id] = room;
    socket.join(room);
    games[room].addPlayer(socket.id);

    const state = {
      room,
      char: games[room].getPlayerChar(socket.id),
      ...games[room].getState(),
    };

    socket.emit("joined-room", state);
  });

  socket.on("tile-clicked", (data: ITileClickedEvent) => {
    if (!games[data.room])
      return socket.emit("join-error", { message: "Invalid room" });
    const game = games[data.room];
    try {
      const gameOver = game.play(data.char, data.location);
      if (gameOver) notifyRoom(data.room, "game-over", game.getWinState());
      notifyRoom(data.room, "tile-clicked", data);
    } catch (err) {
      socket.emit("play-error", { message: err.message });
    }
  });

  socket.on("new-room", () => {
    const room = createRoom();
    socket.join(room);
    playerRoom[socket.id] = room;
    games[room].addPlayer(socket.id);
    socket.emit("joined-room", { room });
  });

  socket.on("disconnect", (reason) => {
    const game = games[playerRoom[socket.id]];
    if (game) game.removePlayer(socket.id);
    console.log(playerRoom[socket.id], "DISCONNECTED", reason);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`listening on ${PORT}`));

interface ITileClickedEvent {
  room: string;
  location: IPoint;
  char: PLAYER;
}
