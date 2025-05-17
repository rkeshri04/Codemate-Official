import { BrowserWindow, dialog, ipcMain, app as electronApp } from 'electron';
import Store from 'electron-store';
import { ipcMainHandle } from '../util.js';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import path from 'path';
import fsPromises from 'fs/promises';
import { writeFileSync, chmodSync } from 'fs';
import { getSystemStats } from '../systemStats.js';
import { isIdeCommand, isDockerRunning, listDockerContainers, startDockerContainer, stopDockerContainer, getWorkflowsFromStore } from '../util.js';


const execAsync = promisify(exec);

// openWithIde function for macOS
async function openWithIde(command: string, workingDirectory?: string): Promise<{success: boolean, message?: string}> {
  try {
    // Different platform-specific ways to open IDE with a specific folder
    if (process.platform === 'win32') {
      // Windows
      if (workingDirectory) {
        await execAsync(`"${command}" "${workingDirectory}"`);
      } else {
        await execAsync(`"${command}"`);
      }
    } else if (process.platform === 'darwin') {
      // macOS
      if (workingDirectory) {
        // On macOS, we need to use the proper way to open VS Code
        if (/code/i.test(command) || /visual studio code/i.test(command)) {
          // For VS Code on macOS, use the 'code' CLI command if present
          try {
            // First try with the CLI command if it's in the PATH
            await execAsync(`cd "${workingDirectory}" && code .`);
            return { success: true };
          } catch (cliError) {
            // If the CLI command fails, try with the application bundle
            try {
              // Open VS Code first
              await execAsync(`open -a "${command}"`);
              // Then open the folder - VS Code will open it in a new window
              await execAsync(`open -a "Visual Studio Code" "${workingDirectory}"`);
              return { success: true };
            } catch (appError) {
              if (process.env.NODE_ENV !== 'production') {
                console.error('Failed to open VS Code with directory:', appError);
              }
              throw appError; // Re-throw to trigger the fallback
            }
          }
        } else {
          // For other apps, use the standard open -a approach
          await execAsync(`open -a "${command}" "${workingDirectory}"`);
        }
      } else {
        await execAsync(`open -a "${command}"`);
      }
    } else {
      // Linux
      if (workingDirectory) {
        // For VS Code on Linux
        if (/code/i.test(command)) {
          await execAsync(`${command} "${workingDirectory}"`);
        } else {
          // For other IDEs, just try launching with the path
          await execAsync(`"${command}" "${workingDirectory}"`);
        }
      } else {
        await execAsync(`"${command}"`);
      }
    }
    return { success: true };
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Failed to open IDE with directory:', error);
    }
    
    // If opening with directory fails, try just opening the application
    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log('Falling back to opening IDE without directory');
      }
      if (process.platform === 'win32') {
        await execAsync(`start "" "${command}"`);
      } else if (process.platform === 'darwin') {
        await execAsync(`open -a "${command}"`);
      } else {
        await execAsync(`xdg-open "${command}"`);
      }
      return { 
        success: true, 
        message: 'Opened application without specified directory'
      };
    } catch (fallbackError: any) {
      return { 
        success: false,
        message: `Failed to open application: ${fallbackError.message}` 
      };
    }
  }
}

async function getInstalledApps(): Promise<{ name: string; path: string; icon?: string }[]> {
  let appsData: { name: string; path: string; iconPath?: string; desktopFilePath?: string }[] = [];

  try {
    if (process.platform === 'darwin') {
      try {
        const { stdout } = await execAsync('ls /Applications');
        const files = stdout.split('\n').map(f => f.trim()).filter(f => f.endsWith('.app'));
        appsData = await Promise.all(
          files.map(async (appName) => {
            const appPath = `/Applications/${appName}`;
            let iconPath: string | undefined = undefined;
            return {
              name: appName.replace(/\.app$/, ''),
              path: appPath,
              iconPath
            };
          })
        );
        appsData = appsData.sort((a, b) => a.name.localeCompare(b.name));
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Error fetching apps:', err);
        }
        appsData = [];
      }
    }
    else if (process.platform === 'win32') {
      const command = `Get-StartApps | Select-Object Name, AppID | ConvertTo-Json -Depth 3`;
      try {
        const { stdout } = await execAsync(`powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "${command}"`);
        const apps = JSON.parse(stdout);
        appsData = apps
          .filter((app: any) => app.Name && app.AppID)
          .map((app: any) => ({ name: app.Name, path: app.AppID }))
          .sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name));
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.error("Error executing PowerShell command:", err);
        }
      }
    } else {
      const appDirs = ['/usr/share/applications', `${os.homedir()}/.local/share/applications`];
      const seenPaths = new Set<string>();
      const foundApps: { name: string; path: string; iconPath?: string; desktopFilePath?: string }[] = [];

      for (const dir of appDirs) {
        try {
          const files = await fsPromises.readdir(dir);
          for (const file of files) {
            if (file.endsWith('.desktop')) {
              try {
                const desktopFilePath = path.join(dir, file);
                const content = await fsPromises.readFile(desktopFilePath, 'utf-8');
                const nameMatch = content.match(/^Name=(.*)/m);
                const execMatch = content.match(/^Exec=(.*)/m);
                const noDisplayMatch = content.match(/^NoDisplay=(true)/m);
                const iconMatch = content.match(/^Icon=(.*)/m);

                if (nameMatch && execMatch && !noDisplayMatch) {
                  const name = nameMatch[1].trim();
                  const execParts = execMatch[1].replace(/%[UufFck]/g, '').trim().split(' ');
                  let appPath = execParts[0];
                  let iconPath = iconMatch ? iconMatch[1].trim() : undefined;

                  if (!path.isAbsolute(appPath)) {
                    try {
                      const { stdout } = await execAsync(`which ${appPath}`);
                      appPath = stdout.trim();
                    } catch (whichErr) {}
                  }

                  let resolvedIconPath: string | undefined = undefined;
                  if (iconPath && !iconPath.startsWith('/')) {
                    const iconThemePaths = [
                      path.join(os.homedir(), '.local/share/icons'),
                      '/usr/share/icons',
                      '/usr/local/share/icons',
                      '/usr/share/pixmaps'
                    ];
                    const extensions = ['.png', '.svg', '.xpm'];
                    for (const themePath of iconThemePaths) {
                      for (const ext of extensions) {
                        const possiblePath = path.join(themePath, 'hicolor', 'scalable', 'apps', `${iconPath}${ext}`);
                        try {
                          await fsPromises.access(possiblePath);
                          resolvedIconPath = possiblePath;
                          break;
                        } catch {}
                        const pixmapPath = path.join('/usr/share/pixmaps', `${iconPath}${ext}`);
                        try {
                          await fsPromises.access(pixmapPath);
                          resolvedIconPath = pixmapPath;
                          break;
                        } catch {}
                      }
                      if (resolvedIconPath) break;
                    }
                  } else if (iconPath && iconPath.startsWith('/')) {
                    resolvedIconPath = iconPath;
                  }

                  if (name && appPath && !seenPaths.has(appPath)) {
                    foundApps.push({ name, path: appPath, iconPath: resolvedIconPath, desktopFilePath });
                    seenPaths.add(appPath);
                  }
                }
              } catch (readErr) {}
            }
          }
        } catch (scanErr: any) {
          if (scanErr.code !== 'ENOENT' && process.env.NODE_ENV !== 'production') {
            console.error(`Error scanning directory ${dir}:`, scanErr);
          }
        }
      }
      appsData = foundApps.sort((a, b) => a.name.localeCompare(b.name));
    }

    const appsWithIcons = await Promise.all(appsData.map(async (app) => {
      try {
        // Linux: Prefer resolved icon path, then executable, then .desktop file
        let iconSource: string | undefined;
        if (process.platform === 'linux') {
          iconSource = app.iconPath || (app.path && app.path !== '' ? app.path : undefined) || app.desktopFilePath;
        } else {
          iconSource = app.path;
        }
        if (!iconSource) {
          return { ...app, icon: undefined };
        }
        const icon = await electronApp.getFileIcon(iconSource, { size: 'small' });
        return {
          ...app,
          icon: icon.toDataURL(),
        };
      } catch (iconError: any) {
        return { ...app, icon: undefined };
      }
    }));

    // Remove iconPath and desktopFilePath from returned objects
    return appsWithIcons.map(({ iconPath, desktopFilePath, ...rest }) => rest);

  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error("Failed to get installed apps:", error);
    }
    return [];
  }
}

async function executeCommandLogic(data: CommandExecutionData, mainWindow?: BrowserWindow): Promise<{ success: boolean; message?: string; results?: any }> {
  try {
    const { type, command, workingDirectory, commands, useTerminalWindow, containerId, dockerAction } = data;

    switch (type) {
      case 'app':
        try {
          if (isIdeCommand(command)) {
            return await openWithIde(command, workingDirectory);
          } else {
            if (process.platform === 'win32') {
              await execAsync(`start "" "${command}"`);
            } else if (process.platform === 'darwin') {
              await execAsync(`open "${command}"`);
            } else {
              await execAsync(`xdg-open "${command}"`);
            }
            return { success: true };
          }
        } catch (err: any) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('Error executing app:', err);
          }
          return { success: false, message: err.message };
        }

      case 'terminal':
        if (useTerminalWindow) {
          try {
            const cmdArray = commands && commands.length > 0 ? commands : [command];

            if (process.platform === 'win32') {
              const scriptContent = cmdArray.join(' && ');
              const tempBatchFile = path.join(os.tmpdir(), `electron_cmd_${Date.now()}.bat`);
              let batchContent = '';
              if (workingDirectory) {
                batchContent += `cd /d "${workingDirectory}"\r\n`;
              }
              for (const cmd of cmdArray) {
                batchContent += `${cmd}\r\n`;
              }
              batchContent += 'pause\r\n';
              writeFileSync(tempBatchFile, batchContent);
              spawn('cmd.exe', ['/c', 'start', 'cmd.exe', '/k', tempBatchFile], {
                shell: true,
                detached: true
              });
            } else if (process.platform === 'darwin') {
              const script = cmdArray.join('; ');
              let finalScript = '';
              if (workingDirectory) {
                finalScript = `cd "${workingDirectory}" && ${script}`;
              } else {
                finalScript = script;
              }
              const escapedScript = finalScript.replace(/"/g, '\\"');
              const appleScript = `tell application "Terminal" to do script "${escapedScript}"`;
              spawn('osascript', ['-e', appleScript], { 
                detached: true,
                stdio: 'ignore' 
              });
            } else {
              const scriptContent = cmdArray.join('; ');
              const tempScript = path.join(os.tmpdir(), `electron_cmd_${Date.now()}.sh`);
              let scriptData = '#!/bin/bash\n';
              if (workingDirectory) {
                scriptData += `cd "${workingDirectory}"\n`;
              }
              scriptData += scriptContent;
              scriptData += '\necho "Press enter to close..."\nread\n';
              writeFileSync(tempScript, scriptData);
              chmodSync(tempScript, '755');
              const terminals = [
                { name: 'gnome-terminal', args: ['--', '/bin/bash', tempScript] },
                { name: 'xterm', args: ['-e', '/bin/bash', tempScript] },
                { name: 'konsole', args: ['--noclose', '-e', '/bin/bash', tempScript] },
                { name: 'xfce4-terminal', args: ['--hold', '-e', `/bin/bash ${tempScript}`] }
              ];
              let terminalFound = false;
              for (const term of terminals) {
                try {
                  const { stdout } = await execAsync(`which ${term.name}`);
                  if (stdout.trim()) {
                    spawn(term.name, term.args, { 
                      detached: true,
                      stdio: 'ignore'
                    }).unref();
                    terminalFound = true;
                    break;
                  }
                } catch (e) {}
              }
              if (!terminalFound) {
                throw new Error('No suitable terminal found');
              }
            }

            return {
              success: true,
              message: 'Commands launched in terminal window'
            };

          } catch (err: any) {
            if (process.env.NODE_ENV !== 'production') {
              console.error('Error launching terminal:', err);
            }
            return {
              success: false,
              message: `Failed to launch terminal: ${err.message}`
            };
          }
        } else {
          const results = [];
          const commandsToExecute = commands && commands.length > 0 ? commands : [command];
          for (const cmd of commandsToExecute) {
            try {
              const finalCommand = workingDirectory
                ? `cd "${workingDirectory}" && ${cmd}`
                : cmd;
              const { stdout, stderr } = await execAsync(finalCommand);
              results.push({
                command: cmd,
                success: true,
                output: stdout,
                error: stderr || undefined
              });
              await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (err: any) {
              results.push({
                command: cmd,
                success: false,
                error: err.message || 'Command execution failed'
              });
              return {
                success: false,
                message: `Command failed: ${err.message}`,
                results
              };
            }
          }
          return {
            success: true,
            results
          };
        }

      case 'url':
        try {
          if (process.platform === 'win32') {
            await execAsync(`start ${command}`);
          } else if (process.platform === 'darwin') {
            await execAsync(`open ${command}`);
          } else {
            await execAsync(`xdg-open ${command}`);
          }
          return { success: true };
        } catch (err: any) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('Error opening URL:', err);
          }
          return { success: false, message: err.message };
        }

      case 'docker':
        if (!containerId || !dockerAction) {
          return { success: false, message: 'Missing container or action' };
        }
        if (!(await isDockerRunning(mainWindow))) {
          return { success: false, message: 'Docker is not running' };
        }
        if (dockerAction === 'start') {
          return await startDockerContainer(containerId);
        } else if (dockerAction === 'stop') {
          return await stopDockerContainer(containerId);
        }
        return { success: false, message: 'Unknown docker action' };

      default:
        return { success: false, message: 'Unsupported command type' };
    }
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error executing command logic:', error);
    }
    return { success: false, message: error.message || 'Failed to execute command logic' };
  }
}

export async function executeWorkflowFromStore(workflowId: string, store: Store<any>, mainWindow?: BrowserWindow) {
  if (!workflowId) {
    return { success: false, message: 'Workflow ID is required' };
  }
  const workflows = store.get('workflows', []);
  const workflow = workflows.find((t: any) => t._id === workflowId);
  if (!workflow || !Array.isArray(workflow.commands) || workflow.commands.length === 0) {
    return { success: false, message: 'Workflow not found or has no commands.' };
  }
  let hasError = false;
  const results = [];
  for (let i = 0; i < workflow.commands.length; i++) {
    const command = workflow.commands[i];
    // Notify renderer of the current running command
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('workflow-step-update', { commandId: command.id });
    }
    // Wait for delaySeconds if set on the previous command (not before the first command)
    if (i > 0) {
      const prev = workflow.commands[i - 1];
      if (typeof prev.delaySeconds === 'number' && prev.delaySeconds > 0) {
        // Keep the highlight on the previous card during the delay
        if (mainWindow && mainWindow.webContents) {
          mainWindow.webContents.send('workflow-step-update', { commandId: prev.id });
        }
        await new Promise(resolve => setTimeout(resolve, prev.delaySeconds * 1000));
        // After delay, set highlight to the current command
        if (mainWindow && mainWindow.webContents) {
          mainWindow.webContents.send('workflow-step-update', { commandId: command.id });
        }
      }
    }
    try {
      const executionData: CommandExecutionData = {
        type: command.type,
        command: command.command,
        workingDirectory: command.workingDirectory,
        commands: command.commands,
        useTerminalWindow: command.useTerminalWindow,
        containerId: command.containerId,
        dockerAction: command.dockerAction,
      };
      const result = await executeCommandLogic(executionData, mainWindow);
      results.push({
        id: command.id,
        success: result.success,
        message: result.message
      });
      if (result.success) {
        // --- Increment timeSavedSeconds in store by 10 ---
        const prev = store.get('timeSavedSeconds', 0);
        store.set('timeSavedSeconds', prev + 10);
      } else {
        hasError = true;
      }
    } catch (commandError: any) {
      results.push({
        id: command.id,
        success: false,
        message: commandError.message || 'Command execution failed unexpectedly'
      });
      hasError = true;
    }
  }
  // After all commands, clear the highlight
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('workflow-step-update', { commandId: null });
  }
  return {
    success: !hasError,
    results
  };
}

// --- Trending/news fetching logic ---
const TRENDING_CACHE_KEY = 'trendingContent';
const TRENDING_CACHE_DURATION_MS = 5 * 60 * 60 * 1000; // 5 hours

const EXCLUDE_KEYWORDS = ["tutorial", "course", "bootcamp", "beginner"];

function isEnglish(text: string): boolean {
  if (!text) return true;
  try {
    return /^[\x00-\x7F]*$/.test(text);
  } catch {
    return false;
  }
}

function containsExcludedKeywords(text: string): boolean {
  if (!text) return false;
  const textLower = text.toLowerCase();
  return EXCLUDE_KEYWORDS.some(word => textLower.includes(word));
}

function getMockRepos() {
  return [];
}
function getMockNews() {
  return [];
}

function interleaveData(repos: any[], news: any[]) {
  const result = [];
  const maxLength = Math.max(repos.length, news.length);
  for (let i = 0; i < maxLength; i++) {
    if (i < repos.length) result.push(repos[i]);
    if (i < news.length) result.push(news[i]);
  }
  return result;
}

// Use fetch API (node-fetch for Node <18, else global fetch)
let fetchFn: typeof fetch;
try {
  fetchFn = global.fetch ? global.fetch.bind(global) : require('node-fetch');
} catch {
  fetchFn = require('node-fetch');
}

// Helper for fetch with timeout using AbortController
async function fetchWithTimeout(resource: string, options: any = {}, timeoutMs = 10000): Promise<Response> {
  const controller = new (globalThis.AbortController || require('abort-controller'))();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetchFn(resource, { ...options, signal: controller.signal });
    return resp;
  } finally {
    clearTimeout(id);
  }
}

async function fetchGithubTrending(): Promise<any[]> {
  // Optionally, get a GitHub token from env for higher rate limits
  const githubToken = process.env.GITHUB_TOKEN || '';
  const headers: any = { "Accept": "application/vnd.github.v3+json" };
  if (githubToken) headers["Authorization"] = `token ${githubToken}`;
  const sinceDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const query = `created:>=${sinceDate}`;
  try {
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=15`;
    const resp = await fetchWithTimeout(url, { headers }, 10000);
    if (!resp.ok) return [];
    const data = await resp.json();
    const filtered: any[] = [];
    for (const repo of data.items || []) {
      const name = repo.name;
      const desc = repo.description || "";
      if (
        isEnglish(name) && isEnglish(desc) &&
        !containsExcludedKeywords(name) && !containsExcludedKeywords(desc)
      ) {
        filtered.push({
          name,
          owner: repo.owner?.login,
          description: desc || "No description provided",
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          language: repo.language,
          url: repo.html_url
        });
      }
      if (filtered.length >= 5) break;
    }
    return filtered;
  } catch (e) {
    return getMockRepos();
  }
}

async function fetchHackerNews(): Promise<any[]> {
  async function fetchHNItem(itemId: number) {
    try {
      const url = `https://hacker-news.firebaseio.com/v0/item/${itemId}.json`;
      const resp = await fetchWithTimeout(url, {}, 5000);
      if (!resp.ok) return null;
      return await resp.json();
    } catch { return null; }
  }
  try {
    const topResp = await fetchWithTimeout("https://hacker-news.firebaseio.com/v0/topstories.json", {}, 10000);
    if (!topResp.ok) return [];
    const topIds: number[] = (await topResp.json()).slice(0, 40);
    const stories = await Promise.all(topIds.map(fetchHNItem));
    const filtered: any[] = [];
    for (const story of stories) {
      if (!story || story.type !== "story") continue;
      const title = story.title || "";
      const url = story.url || "";
      if (isEnglish(title) && !containsExcludedKeywords(title)) {
        filtered.push({
          title,
          source: "Hacker News",
          description: "No description available",
          url,
          published_at: new Date((story.time || 0) * 1000).toISOString()
        });
      }
      if (filtered.length >= 3) break;
    }
    return filtered;
  } catch { return []; }
}

async function fetchDevTo(): Promise<any[]> {
  try {
    const resp = await fetchWithTimeout("https://dev.to/api/articles?per_page=10&top=7", {}, 10000);
    if (!resp.ok) return [];
    const articles = await resp.json();
    const filtered: any[] = [];
    for (const article of articles) {
      const title = article.title || "";
      const desc = article.description || "";
      const url = article.url || "";
      if (isEnglish(title) && !containsExcludedKeywords(title)) {
        filtered.push({
          title,
          source: "Dev.to",
          description: desc || "No description available",
          url,
          published_at: article.published_at || ""
        });
      }
      if (filtered.length >= 2) break;
    }
    return filtered;
  } catch { return []; }
}

async function fetchRedditProgramming(): Promise<any[]> {
  try {
    const headers = { "User-Agent": "CodemateBot/0.1" };
    const resp = await fetchWithTimeout("https://www.reddit.com/r/programming/hot.json?limit=10", { headers }, 10000);
    if (!resp.ok) return [];
    const posts = (await resp.json()).data?.children || [];
    const filtered: any[] = [];
    for (const post of posts) {
      const data = post.data || {};
      const title = data.title || "";
      const url = "https://reddit.com" + (data.permalink || "");
      if (isEnglish(title) && !containsExcludedKeywords(title)) {
        filtered.push({
          title,
          source: "Reddit r/programming",
          description: data.selftext || "No description available",
          url,
          published_at: new Date((data.created_utc || 0) * 1000).toISOString()
        });
      }
      if (filtered.length >= 2) break;
    }
    return filtered;
  } catch { return []; }
}

async function fetchProgrammingNews(): Promise<any[]> {
  const [hn, devto, reddit] = await Promise.all([
    fetchHackerNews(),
    fetchDevTo(),
    fetchRedditProgramming()
  ]);
  let news = [...hn, ...devto, ...reddit];
  news = news.sort((a, b) => String(b.published_at || "").localeCompare(String(a.published_at || "")));
  return news.slice(0, 5);
}

async function fetchTrendingAndNews(): Promise<{repos: any[], news: any[]}> {
  const [repos, news] = await Promise.all([
    fetchGithubTrending(),
    fetchProgrammingNews()
  ]);
  return { repos, news };
}

// --- Trending/news storage and IPC handler ---
export function setupCommandHandlers(mainWindow: BrowserWindow, store: Store<any>) {
  // Remove existing handlers before registering new ones to avoid duplicates
  ipcMain.removeHandler('executeCommand');
  ipcMainHandle('executeCommand', async (data: CommandExecutionData) => {
    return await executeCommandLogic(data, mainWindow);
  });

  ipcMain.removeHandler('docker-status');
  ipcMainHandle('docker-status' as any, async () => {
    const running = await isDockerRunning(mainWindow);
    return { running };
  });

  ipcMain.removeHandler('docker-list-containers');
  ipcMainHandle('docker-list-containers' as any, async ({ all }: { all: boolean }) => {
    if (!(await isDockerRunning(mainWindow))) {
        return { containers: [] };
    }
    try {
        const containers = await listDockerContainers(all);
        return { containers };
    } catch (error: any) {
        if (mainWindow) {
            mainWindow.webContents.send('toast-notification', {
                type: 'error',
                message: `Failed to list Docker containers: ${error.message}`
            });
        }
        return { containers: [] };
    }
  });

  ipcMain.removeHandler('docker-start-container');
  ipcMainHandle('docker-start-container' as any, async ({ id }: { id: string }) => {
    return await startDockerContainer(id);
  });

  ipcMain.removeHandler('docker-stop-container');
  ipcMainHandle('docker-stop-container' as any, async ({ id }: { id: string }) => {
    return await stopDockerContainer(id);
  });

  ipcMain.removeHandler('selectFolder');
  ipcMainHandle('selectFolder', async () => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
      });
      if (result.canceled || result.filePaths.length === 0) {
        return { success: false };
      }
      return {
        success: true,
        folderPath: result.filePaths[0],
      };
    } catch (error) {
      return { success: false, message: 'Failed to select folder' };
    }
  });

  ipcMain.removeHandler('selectFile');
  ipcMainHandle('selectFile', async () => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
      });
      if (result.canceled || result.filePaths.length === 0) {
        return { success: false };
      }
      return {
        success: true,
        filePath: result.filePaths[0],
      };
    } catch (error) {
      return { success: false, message: 'Failed to select file' };
    }
  });

  ipcMain.removeHandler('get-installed-apps');
  ipcMainHandle('get-installed-apps' as any, async () => {
    try {
      const apps = await getInstalledApps();
      return { success: true, apps };
    } catch (error: any) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('IPC Error getting installed apps:', error);
      }
      return { success: false, message: error.message || 'Failed to get apps', apps: [] };
    }
  });

  ipcMain.removeHandler('getWorkflowsForTrayMenu');
  ipcMainHandle('getWorkflowsForTrayMenu' as any, async () => {
    try {
      const workflows = getWorkflowsFromStore(store);
      return { success: true, workflows };
    } catch (error: any) {
      console.error('Error getting workflows for tray/menu:', error);
      return { success: false, message: error.message, workflows: [] };
    }
  });
  
  ipcMain.removeHandler('executeWorkflowFromTray');
  ipcMainHandle('executeWorkflowFromTray' as any, async (workflowId: string) => {
    return await executeWorkflowFromStore(workflowId, store, mainWindow);
  });

  ipcMain.removeHandler('getSystemStats');
  ipcMainHandle('getSystemStats', async () => {
    try {
      const stats = getSystemStats();
      return { success: true, ...stats };
    } catch (error) {
      return { success: false, message: 'Failed to get system stats' };
    }
  });

  // --- Trending/news IPC handler ---
  const trendingHandlerKey = 'getTrendingContent';
  const trendingStoreKey = TRENDING_CACHE_KEY;

  // Remove existing handler if any
  try { ipcMain.removeHandler(trendingHandlerKey); } catch {}

  ipcMainHandle(trendingHandlerKey as any, async () => {
    let trendingData = store.get(trendingStoreKey, null);
    const now = Date.now();
    let shouldUpdate = true;
    if (trendingData && trendingData.lastUpdated) {
      const last = typeof trendingData.lastUpdated === 'number'
        ? trendingData.lastUpdated
        : new Date(trendingData.lastUpdated).getTime();
      if (now - last < TRENDING_CACHE_DURATION_MS) {
        shouldUpdate = false;
      }
    }
    if (shouldUpdate) {
      try {
        const { repos, news } = await fetchTrendingAndNews();
        trendingData = {
          repos,
          news,
          lastUpdated: now
        };
        store.set(trendingStoreKey, trendingData);
      } catch {
        // fallback: keep old data if fetch fails
        trendingData = trendingData || { repos: [], news: [], lastUpdated: now };
      }
    }
    return trendingData;
  });

  // --- Add IPC handler to get total time saved ---
  ipcMain.removeHandler('getTimeSavedSeconds');
  ipcMainHandle('getTimeSavedSeconds' as any, async () => {
    const timeSavedSeconds = store.get('timeSavedSeconds', 0);
    return { success: true, timeSavedSeconds };
  });
}


