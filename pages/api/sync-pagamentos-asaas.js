import { exec } from "child_process";

export default function handler(req, res) {
  exec("node scripts/syncPagamentosAsaas.js", (err, stdout, stderr) => {
    if (err) {
      res.status(500).json({ error: err.message, stderr, success: false });
    } else {
      res.status(200).json({ output: stdout, success: true });
    }
  });
}
