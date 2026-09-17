const { app, BrowserWindow, Menu, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow = null;
function getIndex() {
  const candidates = [path.join(process.resourcesPath, "app", "out", "index.html"), path.join(__dirname, "out", "index.html")];
  const found = candidates.find(p => fs.existsSync(p));
  if (!found) throw new Error("index.html dell'app non trovato.");
  return found;
}
app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);
  try {
    const index = getIndex();
    mainWindow = new BrowserWindow({ width: 1440, height: 920, minWidth: 1100, minHeight: 700, title: "Famiglia Grassi", icon: path.join(process.resourcesPath, "assets", "famiglia-grassi.ico"), autoHideMenuBar: true, webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true } });
    await mainWindow.loadFile(index);
  } catch (e) {
    dialog.showErrorBox("Famiglia Grassi", `Impossibile avviare l'app.\n\n${e.message}`);
    app.quit();
  }
});
app.on("window-all-closed", () => app.quit());
