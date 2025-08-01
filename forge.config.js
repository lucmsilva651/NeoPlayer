const { FusesPlugin } = require("@electron-forge/plugin-fuses");
const { FuseV1Options, FuseVersion } = require("@electron/fuses");
const package = require("./package.json");

module.exports = {
  buildIdentifier: "com.lucmsilva.neoplayer",
  packagerConfig: {
    appCategoryType: "public.app-category.music",
    icon: "src/icons/icon",
    asar: true,
  },
  makers: [
    {
      name: "@electron-forge/maker-rpm",
      config: {
        options: {
          categories: package.appCategories.split(),
          description: package.description,
          productName: package.packageName,
          icon: "src/icons/icon.png",
          license: package.license,
          version: package.version,
          compressionLevel: 9
        }
      }
    },
    {
      name: "@electron-forge/maker-deb",
      config: {
        options: {
          categories: package.appCategories,
          description: package.description,
          productName: package.packageName,
          maintainer: package.author.name,
          icon: "src/icons/icon.png",
          version: package.version,
          priority: "optional"
        }
      }
    },
    {
      name: "@electron-forge/maker-dmg",
      config: {
        icon: "src/icons/icon.icns",
        name: package.packageName,
        format: "UDZO"
      }
    },
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        setupIcon: "src/icons/icon.ico",
        appVersion: package.version,
        name: package.packageName
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
      [FuseV1Options.GrantFileProtocolExtraPrivileges]: false,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
