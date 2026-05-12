import type { ImgHTMLAttributes } from 'react'

const Logo = (props: ImgHTMLAttributes<HTMLImageElement>) => {
  const { alt = 'Logo', src = '/images/logos/logo.svg', style, ...rest } = props

  return (
    <img
      src={src}
      alt={alt}
      style={{ width: '2.5em', height: '2.5em', objectFit: 'contain', ...style }}
      {...rest}
    />
  )
}

export default Logo

