import { spawn } from 'child_process';

const port = process.env.PORT || 3000;

console.log(`Starting Vite preview server on port ${port}...`);

const vite = spawn('vite', ['preview', '--host', '0.0.0.0', '--port', port.toString()], {
  stdio: 'inherit',
  shell: true
});

vite.on('error', (error) => {
  console.error('Error starting server:', error);
  process.exit(1);
});

vite.on('exit', (code) => {
  process.exit(code || 0);
});

