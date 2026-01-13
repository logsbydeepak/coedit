import { ImageResponse } from 'next/og'

import { LogoIcon } from '#/components/icons/logo'

export const runtime = 'edge'

export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        background: '#1A1A1A',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        borderRadius: '100%',
      }}
    >
      <LogoIcon
        style={{
          width: '52%',
          height: '52%',
        }}
      />
    </div>,
    {
      ...size,
    }
  )
}
