var io;
const redisAdapter = require("socket.io-redis");
const { instrument } = require("@socket.io/admin-ui");

export const initSocket = async (port) => {
  try {
    io = require("socket.io")(port, {
      // maxHttpBufferSize: 100000000,
      // connectTimeout: 5000,
      transports: ["websocket", "polling"],
      // pingInterval: 25 * 1000,
      // pingTimeout: 5000,
      allowEIO3: true,
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    console.log(`socket listen ${port}`);
    const host =
      process.env.PRODUCTION === "true"
        ? process.env.REDIS_SERVER
        : "localhost";

    // io.adapter(
    //   redisAdapter({
    //     url: process.env.REDIS_URL,
    //   })
    // );
    io.of("/").adapter.on("error", function(err) {
      console.error("Redis adapter error", err);
      process.exit();
    });

    instrument(io, {
      auth: {
        type: "basic",
        username: "admin",
        password: require("bcrypt").hashSync("zignoFtswelEOLA", 10),
      },
    });

    io.on("connection", (socket) => {
      console.log("socket connected", socket.id);
      socket.on("JOIN_ROOM", (roomId) => {
        try {
          socket.join(roomId);
          console.log(`log: ${roomId} JOIN_ROOM`);
        } catch (error) {
          socket.disconnect();
          console.error("socket connection err", error.message);
        }
      });

      socket.on("LEAVE_ROOM", (roomId) => {
        try {
          console.log(`log: userid ${roomId} LEAVE_ROOM`);
        } catch (error) {
          console.error("socket error:", error.message);
        }
      });

      socket.on("disconnect", () => {
        console.log("socket disconnected: ", socket.id);
      });
    });
  } catch (error) {
    console.error("socket error:", error);
  }
};

export const socketEmit = (roomId = null, event, data) => {

    
  const romId = roomId ? roomId : process.env.SOCKET_ROOM;
  try {
    if (!io) return;

    io.to(roomId).emit(event, data);
  } catch (error) {
    console.error("socketEmit error:", error);
  }
};

export const emitAll = (event, data) => {
  try {
    if (!io) return;
    console.log(event);
    
    io.sockets.emit(event, data);
  } catch (error) {
    console.error("socketEmitAll error:", error);
  }
};
