import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import squirrelStartup from 'electron-squirrel-startup'

if (squirrelStartup) {
  app.quit()
}
// Sovelluksen nimi
app.setName('MammanSofta')

//Luodaan sovelluksen ikkuna
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1300,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, is.dev ? '../preload/index.js' : '../preload/index.js'),
      sandbox: false
    }
  })

  //näytetään ikkuna, kun se on valmis.
  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })
  // Estetään uusien ikkunoiden avaaminen ja ohjaa ulkoiset URL-osoitteet selaimeen
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Ladataan kehitysympäristössä URL, muutoin (distribution)
  //ladataan tiedosto
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(
      join(__dirname, is.dev ? '../renderer/index.html' : '../renderer/index.html')
    )
  }

  // Tulostus-pyynnön käsittely
  ipcMain.handle('print', async (event, content) => {
    const printWindow = new BrowserWindow({ show: false })
    printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(content)}`)
    printWindow.webContents.on('did-finish-load', () => {
      printWindow.webContents.print(
        {
          printBackground: false,
          silent: false,
          color: true,
          margins: {
            marginType: 'printableArea'
          },
          landscape: true,
          pageSize: 'A4',
          copies: 1
        },
        (success, errorType) => {
          if (!success) console.log('Print failed:', errorType)
          printWindow.close()
        }
      )
    })
  })
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })
  createWindow()
})

//Suljetaan sovellus, kun käyttäjä sulkee kaikki ikkunat.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
