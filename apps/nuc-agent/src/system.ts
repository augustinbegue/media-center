import os from 'os';
import type { SystemStats } from '@media-center/shared';

export function getSystemStats(): SystemStats {
  const cpus = os.cpus();
  const totalIdle = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);
  const totalTick = cpus.reduce(
    (acc, cpu) => acc + Object.values(cpu.times).reduce((s, t) => s + t, 0),
    0
  );
  const cpuPercent = Math.round((1 - totalIdle / totalTick) * 100);

  const totalMem = os.totalmem();
  const freeMem = os.freemem();

  return {
    cpuPercent,
    memUsedMb: Math.round((totalMem - freeMem) / 1024 / 1024),
    memTotalMb: Math.round(totalMem / 1024 / 1024),
    uptime: Math.round(os.uptime()),
  };
}
