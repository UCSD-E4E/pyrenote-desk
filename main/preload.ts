import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

// Expose safe APIs to the renderer process
//allows the user to send api's to the database
contextBridge.exposeInMainWorld('api', {
  runQuery: (query, params) => ipcRenderer.invoke('db-query', query, params),  // Send query to main process
});

const handler = {
  send(channel: string, value: unknown) {
    ipcRenderer.send(channel, value)
  },
  on(channel: string, callback: (...args: unknown[]) => void) {
    const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
      callback(...args)
    ipcRenderer.on(channel, subscription)

    return () => {
      ipcRenderer.removeListener(channel, subscription)
    }
  },
}

contextBridge.exposeInMainWorld('ipc', handler)

export type IpcHandler = typeof handler
