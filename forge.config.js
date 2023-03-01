module.exports = {
  packagerConfig: {},
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        "author": "MPDL Collections",
        "description": "Direct file upload to research data repository"
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        "author": "MPDL Collections",
        "description": "Direct file upload to research data repository"
      },
    },
    /*
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
    */
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
