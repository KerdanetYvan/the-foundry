import net from "net";

const RCON_PACKET_TYPE = {
  AUTH: 3,
  AUTH_RESPONSE: 2,
  COMMAND: 2,
  RESPONSE: 0,
} as const;

function buildPacket(id: number, type: number, body: string): Buffer {
  const bodyBuf = Buffer.from(body, "utf8");
  const size = 4 + 4 + bodyBuf.length + 2; // id + type + body + 2 null bytes
  const packet = Buffer.alloc(4 + size);
  packet.writeInt32LE(size, 0);
  packet.writeInt32LE(id, 4);
  packet.writeInt32LE(type, 8);
  bodyBuf.copy(packet, 12);
  packet.writeInt16LE(0, 12 + bodyBuf.length);
  return packet;
}

function parseResponse(buf: Buffer): { id: number; type: number; body: string } {
  const id = buf.readInt32LE(4);
  const type = buf.readInt32LE(8);
  const body = buf.toString("utf8", 12, buf.length - 2);
  return { id, type, body };
}

export type ServerInfo = {
  online: boolean;
  players: { online: number; max: number } | null;
  tps: number | null;
};

export async function getServerInfo(): Promise<ServerInfo> {
  if (!process.env.RCON_HOST) {
    if (process.env.NODE_ENV === "development") {
      return { online: true, players: { online: 3, max: 15 }, tps: 19.8 };
    }
    return { online: false, players: null, tps: null };
  }
  try {
    const [listRes, tpsRes] = await Promise.all([
      rconCommand("list"),
      rconCommand("forge tps"),
    ]);
    const playersMatch = listRes.match(/There are (\d+) of a max of (\d+)/);
    const tpsMatch = tpsRes.match(/Overall.*?Mean TPS:\s*([\d.]+)/);
    return {
      online: true,
      players: playersMatch
        ? { online: parseInt(playersMatch[1], 10), max: parseInt(playersMatch[2], 10) }
        : null,
      tps: tpsMatch ? parseFloat(tpsMatch[1]) : null,
    };
  } catch {
    return { online: false, players: null, tps: null };
  }
}

export async function rconCommand(command: string): Promise<string> {
  const host = process.env.RCON_HOST ?? "localhost";
  const port = parseInt(process.env.RCON_PORT ?? "25575", 10);
  const password = process.env.RCON_PASSWORD ?? "";

  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port }, () => {
      socket.write(buildPacket(1, RCON_PACKET_TYPE.AUTH, password));
    });

    let authDone = false;

    socket.on("data", (data: Buffer) => {
      const packet = parseResponse(data);

      if (!authDone) {
        if (packet.id === -1) {
          socket.destroy();
          return reject(new Error("RCON authentication failed"));
        }
        authDone = true;
        socket.write(buildPacket(2, RCON_PACKET_TYPE.COMMAND, command));
        return;
      }

      socket.destroy();
      resolve(packet.body);
    });

    socket.on("error", reject);
    socket.setTimeout(5000, () => {
      socket.destroy();
      reject(new Error("RCON connection timed out"));
    });
  });
}
