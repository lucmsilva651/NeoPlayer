/** @type {import('electron-forge').ForgeConfig} */
export default {
  packagerConfig: {
    asar: true,
    icon: 'app/icons/win/icon',
    appBundleId: 'com.lucmsilva.neoplayer',
    appCategoryType: 'public.app-category.music',
    "win32metadata": {
      "CompanyName": "Lucas Gabriel (lucmsilva)",
      "ProductName": "NeoPlayer"
    }
  },
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'lucmsilva651',
          name: 'NeoPlayer'
        },
        prerelease: true
      }
    }
  ],
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'NeoPlayer',
        setupIcon: 'app/icons/win/icon.ico'
      }
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          icon: 'app/icons/png',
          category: 'Audio'
        }
      }
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        format: 'ULFO',
        icon: 'app/icons/mac/icon.icns'
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin']
    }
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {}
    }
  ],
  hooks: {},
  publishers: [],
  buildIdentifier: 'com.lucmsilva.neoplayer'
};