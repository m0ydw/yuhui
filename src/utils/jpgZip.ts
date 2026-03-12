export function compressImage(
  file: File,
  maxWidth = 1200, // 更大尺寸
  maxHeight = 1200,
  quality = 0.85, // 更高质量
): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image()
    img.src = URL.createObjectURL(file)

    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!

      let width = img.width
      let height = img.height

      // 只缩超大图，不压太小
      if (width > maxWidth) {
        height = (maxWidth / width) * height
        width = maxWidth
      }
      if (height > maxHeight) {
        width = (maxHeight / height) * width
        height = maxHeight
      }

      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)

      // 提高质量 → 更清晰、更大体积
      canvas.toBlob(
        (blob) => {
          resolve(blob!)
        },
        'image/jpeg',
        quality, // 0.85 = 高清
      )
    }
  })
}
