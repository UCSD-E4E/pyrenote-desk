import { exec } from 'child_process';

export default function handler(req, res) {
  if (req.method === 'POST') {
    const { recordingID } = req.body;

    exec(`python pyfiles/script.py ${recordingID}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        res.status(500).json({ error: 'Error executing script' });
        return;
      }
      if (stderr) {
        console.error(`Stderr: ${stderr}`);
        res.status(500).json({ error: 'Error executing script' });
        return;
      }
      console.log(`Stdout: ${stdout}`);
      res.status(200).json({ message: `Recording ID submitted: ${recordingID}`, output: stdout });
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}