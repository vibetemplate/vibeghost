import { BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { app } from 'electron'

export class ModalManager {
  private modalWindow: BrowserWindow | null = null
  private parentWindow: BrowserWindow

  constructor(parentWindow: BrowserWindow) {
    this.parentWindow = parentWindow
    this.setupEventListeners()
  }

  private createModalWindow() {
    if (this.modalWindow) {
      this.modalWindow.focus()
      return
    }

    const parentBounds = this.parentWindow.getBounds()
    this.modalWindow = new BrowserWindow({
      parent: this.parentWindow,
      width: 500,
      height: 400,
      x: parentBounds.x + Math.round((parentBounds.width - 500) / 2),
      y: parentBounds.y + Math.round((parentBounds.height - 400) / 2),
      modal: true,
      frame: false,
      transparent: true,
      show: false,
      resizable: false,
      webPreferences: {
        preload: join(__dirname, '../preload/preload.js'),
        contextIsolation: true,
        nodeIntegration: false
      }
    })

    if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
      this.modalWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/src/modal/index.html`)
    } else {
      this.modalWindow.loadFile(join(__dirname, '../renderer/modal/index.html'))
    }

    this.modalWindow.once('ready-to-show', () => {
      this.modalWindow?.show()
    })

    this.modalWindow.on('closed', () => {
      this.modalWindow = null
    })
  }

  public showModal(type: string, props?: any) {
    this.createModalWindow()
    this.modalWindow?.webContents.once('dom-ready', () => {
        this.modalWindow?.webContents.send('show-modal-in-view', type, props)
    })
  }

  public hideModal() {
    this.modalWindow?.close()
    this.modalWindow = null
  }

  private setupEventListeners() {
    ipcMain.on('show-modal', (_, type, props) => {
      this.showModal(type, props)
    })

    ipcMain.on('hide-modal', () => {
      this.hideModal()
    })
  }
} 