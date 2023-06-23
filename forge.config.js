module.exports = {
  packagerConfig: {
    "icon": "assets/favicons/favicon"
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        "author": "MPDL Collections",
        "description": "Direct file upload to research data repository",
        "icon": "assets/favicons/favicon.ico"
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
      config: {
        "icon": "assets/favicons/favicon.icns"  
      },
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        "author": "MPDL Collections",
        "description": "Direct file upload to research data repository",
        "icon": "assets/favicons/favicon.png"
      },
    },
    /*
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
    */
    {
      name: '@electron-forge/maker-dmg',
      config: {
        "icon": "assets/favicons/favicon.icns"  
      }
    },
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'vilarodr',
          name: 'MPDL/upverse',
        },
        prerelease: true,
        draft: true,
      },
    },
  ],
};
