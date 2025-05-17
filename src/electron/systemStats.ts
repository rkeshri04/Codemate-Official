import os from 'os';

/**
 * Gets the current system resource usage
 */
export function getSystemStats() {
  const cpus = os.cpus();
  let totalIdle = 0;
  let totalTick = 0;

  cpus.forEach((cpu) => {
    for (const type in cpu.times) {
      totalTick += cpu.times[type as keyof typeof cpu.times];
    }
    totalIdle += cpu.times.idle;
  });

  const idlePercent = totalIdle / totalTick;
  const cpuUsage = 100 - idlePercent * 100;

  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const ramUsage = Math.round((usedMemory / totalMemory) * 100);

  const systemInfo = {
    totalMemoryMB: Math.round(totalMemory / (1024 * 1024)),
  };

  return {
    cpuUsage: Math.round(cpuUsage),
    ramUsage,
    systemInfo,
  };
}
