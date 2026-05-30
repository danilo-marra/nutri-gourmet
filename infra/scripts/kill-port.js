const { execSync } = require("child_process");

const port = process.argv[2] || "3000";

try {
  if (process.platform === "win32") {
    const output = execSync(`netstat -ano | findstr :${port}`, {
      encoding: "utf8",
    }).trim();

    const pids = [
      ...new Set(
        output
          .split("\n")
          .filter(
            (l) =>
              l.includes(`0.0.0.0:${port} `) ||
              l.includes(`127.0.0.1:${port} `) ||
              l.includes(`[::]:${port} `),
          )
          .map((l) => l.trim().split(/\s+/).pop())
          .filter(Boolean),
      ),
    ];

    for (const pid of pids) {
      execSync(`taskkill /F /PID ${pid}`, { stdio: "pipe" });
    }

    if (pids.length > 0) {
      console.log(`Porta ${port} liberada (PID ${pids.join(", ")}).`);
    }
  } else {
    const pids = execSync(`lsof -ti :${port}`, { encoding: "utf8" })
      .trim()
      .split("\n")
      .filter(Boolean);

    for (const pid of pids) {
      execSync(`kill -9 ${pid}`, { stdio: "pipe" });
    }

    if (pids.length > 0) {
      console.log(`Porta ${port} liberada (PID ${pids.join(", ")}).`);
    }
  }
} catch {
  // Porta já estava livre
}
