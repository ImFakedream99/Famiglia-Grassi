const { app, BrowserWindow, Menu, dialog, ipcMain, safeStorage } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");
const fs = require("fs");

let mainWindow = null;
const credentialsFile = path.join(app.getPath("userData"), "login.dat");

function getIndex() {
  const candidates = [
    path.join(process.resourcesPath, "app", "out", "index.html"),
    path.join(__dirname, "out", "index.html"),
  ];
  const found = candidates.find((p) => fs.existsSync(p));
  if (!found) throw new Error("index.html dell'app non trovato.");
  return found;
}

function readCredentials() {
  try {
    if (!fs.existsSync(credentialsFile) || !safeStorage.isEncryptionAvailable()) return null;
    const encrypted = fs.readFileSync(credentialsFile);
    return JSON.parse(safeStorage.decryptString(encrypted));
  } catch {
    return null;
  }
}

function saveCredentials(credentials) {
  if (!safeStorage.isEncryptionAvailable()) return false;
  const encrypted = safeStorage.encryptString(JSON.stringify(credentials));
  fs.writeFileSync(credentialsFile, encrypted, { mode: 0o600 });
  return true;
}

function clearCredentials() {
  try {
    if (fs.existsSync(credentialsFile)) fs.unlinkSync(credentialsFile);
  } catch {}
}

function sendUpdateStatus(status, data = {}) {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send("update-status", { status, ...data });
}

ipcMain.handle("credentials:get", () => readCredentials());
ipcMain.handle("credentials:set", (_event, credentials) => saveCredentials(credentials));
ipcMain.handle("credentials:clear", () => { clearCredentials(); return true; });
ipcMain.handle("updates:check", async () => {
  try {
    const result = await autoUpdater.checkForUpdates();
    if (!result?.updateInfo) {
      sendUpdateStatus("not-available");
      return { available: false };
    }
    return {
      available: result.updateInfo.version !== app.getVersion(),
      version: result.updateInfo.version,
    };
  } catch (error) {
    sendUpdateStatus("error", { message: error.message });
    return { available: false, error: error.message };
  }
});
ipcMain.handle("updates:install", () => {
  autoUpdater.quitAndInstall(false, true);
  return true;
});

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

autoUpdater.on("checking-for-update", () => sendUpdateStatus("checking"));
autoUpdater.on("update-available", (info) => sendUpdateStatus("available", { version: info.version }));
autoUpdater.on("update-not-available", () => sendUpdateStatus("not-available"));
autoUpdater.on("download-progress", (progress) => sendUpdateStatus("downloading", { percent: Math.round(progress.percent) }));
autoUpdater.on("update-downloaded", (info) => sendUpdateStatus("downloaded", { version: info.version }));
autoUpdater.on("error", (error) => sendUpdateStatus("error", { message: error.message }));

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);
  try {
    const index = getIndex();
    mainWindow = new BrowserWindow({
      width: 1440,
      height: 920,
      minWidth: 1100,
      minHeight: 700,
      title: "Famiglia Grassi",
      icon: path.join(__dirname, "assets", "famiglia-grassi.svg"),
      autoHideMenuBar: true,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        preload: path.join(__dirname, "preload.js"),
        sandbox: false,
      },
    });
    await mainWindow.loadFile(index);
    setTimeout(() => autoUpdater.checkForUpdates().catch(() => {}), 5000);
  } catch (e) {
    dialog.showErrorBox("Famiglia Grassi", `Impossibile avviare l'app.\n\n${e.message}`);
    app.quit();
  }
});

app.on("window-all-closed", () => app.quit());
