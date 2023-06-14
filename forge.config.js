module.exports = {
  packagerConfig: {
    "icon": "assets/favicons/edmond_favicon_red"
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        "author": "MPDL Collections",
        "description": "Direct file upload to research data repository",
        "icon": "assets/favicons/edmond_favicon_red.ico"
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
      config: {
        "icon": "assets/favicons/edmond_favicon_red.icns"  
      },
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        "author": "MPDL Collections",
        "description": "Direct file upload to research data repository",
        "icon": "assets/favicons/edmond_favicon_red.png"
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
        "icon": "assets/favicons/edmond_favicon_red.icns"  
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
