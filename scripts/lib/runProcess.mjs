// Extraído de generate-audio.mjs (era local, agora compartilhado com
// transcode-gif-media.mjs) — spawn de um binário sem shell, texto opcional
// por stdin (nunca por interpolação de comando), timeout configurável.
import { spawn } from "node:child_process";

export function runProcess(command, args, { stdinText, timeoutMs = 120_000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["pipe", "ignore", "pipe"] });
    let stderr = "";

    const timeout = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`${command} excedeu o tempo limite de ${timeoutMs}ms`));
    }, timeoutMs);

    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    child.on("close", (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} saiu com código ${code}: ${stderr.trim()}`));
      }
    });

    if (stdinText !== undefined) {
      child.stdin.write(stdinText);
    }
    child.stdin?.end();
  });
}
