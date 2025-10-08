import type { PixelCrop } from 'react-image-crop'

const getBase64FromCropImage = (image: HTMLImageElement, pixelCrop: PixelCrop) => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('No 2d content')
  }

  const pixelRatio = window.devicePixelRatio
  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height

  canvas.width = Math.floor(pixelCrop.width * scaleX * pixelRatio)
  canvas.height = Math.floor(pixelCrop.height * scaleY * pixelRatio)

  ctx.scale(pixelRatio, pixelRatio)
  ctx.imageSmoothingQuality = 'high'
  ctx.save()

  const cropX = pixelCrop.x * scaleX
  const cropY = pixelCrop.y * scaleY

  ctx.translate(-cropX, -cropY)
  ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight, 0, 0, image.naturalWidth, image.naturalHeight)
  ctx.restore()

  // Converting to base64

  return canvas.toDataURL('image/jpeg')
}

export default getBase64FromCropImage
