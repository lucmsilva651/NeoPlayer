const { FusesPlugin } = require("@electron-forge/plugin-fuses");
const { FuseV1Options, FuseVersion } = require("@electron/fuses");

module.exports = {
  buildIdentifier: "com.lucmsilva.neoplayer",
  packagerConfig: {
    appCategoryType: "public.app-category.music",
    icon: "src/icons/icon",
    name: "NeoPlayer",
    asar: true,
  },
  makers: [
    {
      name: "@electron-forge/maker-rpm",
      config: {
        options: {
          category: "Audio",
          icon: "src/icons/icon.png"
        }
      }
    },
    {
      name: "@electron-forge/maker-deb",
      config: {
        options: {
          category: "Audio",
          icon: "src/icons/icon.png"
        }
      }
    },
    {
      name: "@electron-forge/maker-dmg",
      config: {
        format: "ULFO",
        icon: "src/icons/icon.icns"
      }
    },
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        setupIcon: "src/icons/icon.ico"
      }
    }
  ],
  plugins: [
    {
      name: "@electron-forge/plugin-auto-unpack-natives",
      config: {}
    },
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
