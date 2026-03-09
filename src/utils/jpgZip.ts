/**
 * 图片截取压缩（固定尺寸 + 清晰质量 + 不模糊）
 * @param file 原始文件
 * @param maxWidth 最大宽度
 * @param maxHeight 最大高度
 * @param quality 质量 0.1 - 1
 */
export function compressImage(
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.8,
): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image()
    img.src = URL.createObjectURL(file)

    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!

      // 等比缩放
      let width = img.width
      let height = img.height

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

      // 转 Blob，清晰质量 0.8
      canvas.toBlob(
        (blob) => {
          resolve(blob!)
        },
        'image/jpeg',
        quality,
      )
    }
  })
}
