import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '值道 - 资产管理',
    short_name: '值道',
    description: '简洁高效的个人资产管理工具',
    start_url: '/',
    display: 'standalone',
    background_color: '#fb923c',
    theme_color: '#fb923c',
    icons: [
      {
        src: '/icon.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  }
}
