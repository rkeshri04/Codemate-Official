import { app, BrowserWindow, Notification, nativeImage, shell, systemPreferences, screen, clipboard } from 'electron';
import screenshot from 'screenshot-desktop';
import fs from 'fs';
import path from 'path';
import { ipcMainHandle } from '../util.js';
import { execSync } from 'child_process';

/**
 * Takes a screenshot of the current screen and copies it to the clipboard
 * with improved quality and reliable file opening
 */
export async function takeAndSaveScreenshot() {
  console.log('Taking screenshot...');

  // --- macOS Permission Check ---
  if (process.platform === 'darwin') {
    const screenAccessStatus = systemPreferences.getMediaAccessStatus('screen');
    if (screenAccessStatus !== 'granted') {
      const message = 'Screen Recording permission is required. Please grant access in System Settings > Privacy & Security.';
      console.error(message);
      new Notification({
        title: 'Codemate Screenshot Failed',
        body: message, 
      }).show();
      shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture');
      return { success: false, message: message };
    }
  }

  try {
    // Determine which display the cursor is on
    let displayIdToCapture: number | undefined;
    if (screen && typeof screen.getCursorScreenPoint === 'function' && typeof screen.getDisplayNearestPoint === 'function') {
      const cursorPoint = screen.getCursorScreenPoint();
      const display = screen.getDisplayNearestPoint(cursorPoint);
      if (display && typeof display.id === 'number') {
        displayIdToCapture = display.id;
      }
    }

    let imgBuffer: Buffer;
    if (process.platform === 'darwin') {
      // On macOS, screenshot-desktop only supports screen: 0 or no screen option.
      // So, always use screen: 0 or fallback to screencapture utility.
      if (displayIdToCapture === 0 || displayIdToCapture === undefined) {
        try {
          imgBuffer = await screenshot({ screen: 0, format: 'png' });
        } catch (err) {
          // fallback to screencapture utility for single display
          const tempPath = path.join(app.getPath('temp'), `temp-screenshot-${Date.now()}.png`);
          execSync(`/usr/sbin/screencapture -x -T 0 -t png "${tempPath}"`);
          imgBuffer = fs.readFileSync(tempPath);
          try { fs.unlinkSync(tempPath); } catch {}
        }
      } else {
        // fallback to screencapture utility for any other display
        const tempPath = path.join(app.getPath('temp'), `temp-screenshot-${Date.now()}.png`);
        execSync(`/usr/sbin/screencapture -x -T 0 -t png "${tempPath}"`);
        imgBuffer = fs.readFileSync(tempPath);
        try { fs.unlinkSync(tempPath); } catch {}
      }
    } else {
      // Use screenshot-desktop for other platforms
      const displays = await screenshot.listDisplays();
      if (!displays || displays.length === 0) {
        console.error('No displays found for screenshot.');
        return { success: false, message: 'No displays found' };
      }
      const screenId = displayIdToCapture !== undefined ? displayIdToCapture : displays[0].id;
      imgBuffer = await screenshot({ screen: screenId, format: 'png' });
    }

    // Copy to clipboard instead of saving to file
    const screenshotImage = nativeImage.createFromBuffer(imgBuffer);
    clipboard.writeImage(screenshotImage);

    const notification = new Notification({
      title: 'Screen Captured',
      body: 'Screenshot copied to clipboard',
      icon: screenshotImage,
      silent: true
    });

    notification.show();

    return { success: true, message: 'Screenshot copied to clipboard' };
  } catch (error: any) {
    console.error('Failed to take or copy screenshot:', error);
    new Notification({
      title: 'Codemate Screenshot Failed',
      body: `Error: ${error.message || 'Unknown error'}`,
    }).show();
    return { success: false, message: error.message || 'Unknown error' };
  }
}

/**
 * Sets up IPC handlers for screenshot functionality
 */
export function setupScreenshotHandlers(mainWindow: BrowserWindow) {
  ipcMainHandle('take-screenshot' as any, async () => {
    return await takeAndSaveScreenshot();
  });
}
