const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("famigliaApp", {
  credentials: {
    get: () => ipcRenderer.invoke("credentials:get"),
    set: (credentials) => ipcRenderer.invoke("credentials:set", credentials),
    clear: () => ipcRenderer.invoke("credentials:clear"),
  },
  updates: {
    check: () => ipcRenderer.invoke("updates:check"),
    install: () => ipcRenderer.invoke("updates:install"),
    onStatus: (callback) => {
      const listener = (_event, data) => callback(data);
      ipcRenderer.on("update-status", listener);
      return () => ipcRenderer.removeListener("update-status", listener);
    },
  },
});
