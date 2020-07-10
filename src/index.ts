import cors from "cors";
import crypto from "crypto";
import express from "express";
import http from "http";
import socketIO from "socket.io";
import { Game } from "./board";
import { ITileClickedEvent } from "./types";

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
  data: any | undefined = undefined
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
    if (!games[room])
      return socket.emit("join-error", { message: "Invalid room" });

    const nPlayers = getNumberOfPlayers(room);

    if (nPlayers == 1) notifyRoom(room, "player-joined");
    else if (nPlayers == 2)
      return socket.emit("join-error", { message: "Room is full" });

    playerRoom[socket.id] = room;
    socket.join(room);
    games[room].addPlayer(socket.id);

    const state = games[room].getState(socket.id);

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
    const game = games[room];
    playerRoom[socket.id] = room;
    game.addPlayer(socket.id);
    socket.join(room);
    socket.emit("joined-room", game.getState(socket.id));
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
