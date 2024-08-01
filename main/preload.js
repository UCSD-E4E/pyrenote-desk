import { contextBridge, ipcRenderer } from 'electron';
var handler = {
    send: function (channel, value) {
        ipcRenderer.send(channel, value);
    },
    on: function (channel, callback) {
        var subscription = function (_event) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            return callback.apply(void 0, args);
        };
        ipcRenderer.on(channel, subscription);
        return function () {
            ipcRenderer.removeListener(channel, subscription);
        };
    },
};
contextBridge.exposeInMainWorld('ipc', handler);
