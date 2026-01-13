module.exports = {
  packagerConfig: {
    name: 'Social Intelligence',
    executableName: 'social-intelligence',
    icon: './icons/icon',
    appBundleId: 'app.lovable.social-intelligence',
    appCategoryType: 'public.app-category.productivity',
    asar: true,
    osxSign: {},
    osxNotarize: process.env.APPLE_ID ? {
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID,
    } : undefined,
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'SocialIntelligence',
        authors: 'Lovable',
        description: 'Social Intelligence Desktop Application',
        iconUrl: 'https://raw.githubusercontent.com/your-repo/icons/icon.ico',
        setupIcon: './icons/icon.ico',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          maintainer: 'Lovable',
          homepage: 'https://lovable.dev',
          icon: './icons/icon.png',
          categories: ['Utility', 'Network'],
        },
      },
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        format: 'ULFO',
        icon: './icons/icon.icns',
        background: './icons/dmg-background.png',
        contents: [
          { x: 130, y: 220, type: 'file', path: process.cwd() },
          { x: 410, y: 220, type: 'link', path: '/Applications' },
        ],
      },
    },
  ],
  publishers: [],
  plugins: [],
};
