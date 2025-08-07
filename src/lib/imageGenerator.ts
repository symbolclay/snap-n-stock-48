// Utility functions to generate edited product images for Feed and Story formats
// Ensures consistent overlays across the app

export interface ProductDataForImage {
  nome: string;
  preco_regular: string;
  preco_oferta?: string;
  imagem: string;
}

const hasOfferFn = (product: ProductDataForImage) =>
  !!product.preco_oferta && product.preco_oferta !== product.preco_regular;

// Shared helper: draws a rounded banner and wraps long text to fit maxWidth
const drawWrappedBanner = (
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  centerY: number,
  maxWidth: number,
  bgColor: string,
  textColor: string,
  fontSize: number,
  radius: number
) => {
  const paddingX = 40;
  const paddingY = 24;

  ctx.font = `bold ${fontSize}px "Arial Black", Arial, sans-serif`;

  const contentMaxWidth = Math.max(10, maxWidth - paddingX * 2);
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const w of words) {
    const test = current ? current + ' ' + w : w;
    const { width } = ctx.measureText(test);
    if (width <= contentMaxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);

  const lineHeight = fontSize * 1.25;
  let longest = 0;
  for (const l of lines) longest = Math.max(longest, ctx.measureText(l).width);

  const rectWidth = Math.min(maxWidth, longest + paddingX * 2);
  const rectHeight = lines.length * lineHeight + paddingY * 2;

  // Background
  ctx.fillStyle = bgColor;
  ctx.beginPath();
  // @ts-ignore - roundRect exists in modern CanvasRenderingContext2D
  ctx.roundRect(centerX - rectWidth / 2, centerY - rectHeight / 2, rectWidth, rectHeight, radius);
  ctx.fill();

  // Text
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  let y = centerY - rectHeight / 2 + paddingY + lineHeight / 2;
  for (const l of lines) {
    ctx.fillText(l, centerX, y);
    y += lineHeight;
  }
};

export const generateEditedImageForFeed = (product: ProductDataForImage): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return resolve('');

    canvas.width = 1080;
    canvas.height = 1350; // 4:5

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const imgAspect = img.width / img.height;
      const canvasAspect = canvas.width / canvas.height;

      let drawWidth: number, drawHeight: number, drawX: number, drawY: number;

      if (imgAspect > canvasAspect) {
        drawHeight = canvas.height;
        drawWidth = drawHeight * imgAspect;
        drawX = (canvas.width - drawWidth) / 2;
        drawY = 0;
      } else {
        drawWidth = canvas.width;
        drawHeight = drawWidth / imgAspect;
        drawX = 0;
        drawY = (canvas.height - drawHeight) / 2;
      }

      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const drawTextWithBackground = (
        text: string, x: number, y: number, width: number, height: number,
        bgColor: string, textColor: string, fontSize: number
      ) => {
        drawWrappedBanner(ctx, text, x, y, width, bgColor, textColor, fontSize, 15);
      };

      const hasOffer = hasOfferFn(product);

      // Top product name banner
      drawTextWithBackground(
        product.nome.toUpperCase(),
        canvas.width / 2, 150,
        canvas.width * 0.85, 100,
        '#FFD700', '#000000', 48
      );

      // Bottom price banner
      const priceText = hasOffer ? `POR R$ ${product.preco_oferta}` : `POR R$ ${product.preco_regular}`;
      drawTextWithBackground(
        priceText,
        canvas.width / 2, canvas.height - 120,
        canvas.width * 0.9, 110,
        '#16A34A', '#FFFFFF', 52
      );

      if (hasOffer) {
        const oldPriceY = canvas.height - 200;
        const oldPriceText = `De R$ ${product.preco_regular}`;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        // @ts-ignore
        ctx.roundRect(canvas.width / 2 - 200, oldPriceY - 30, 400, 60, 10);
        ctx.fill();

        ctx.fillStyle = '#CCCCCC';
        ctx.font = 'bold 32px Arial';
        ctx.fillText(oldPriceText, canvas.width / 2, oldPriceY);

        const textMetrics = ctx.measureText(oldPriceText);
        ctx.strokeStyle = '#FF4444';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2 - textMetrics.width / 2, oldPriceY);
        ctx.lineTo(canvas.width / 2 + textMetrics.width / 2, oldPriceY);
        ctx.stroke();
      }

      const editedImageData = canvas.toDataURL('image/jpeg', 0.9);
      resolve(editedImageData);
    };

    img.src = product.imagem;
  });
};

export const generateEditedImageForStory = (product: ProductDataForImage): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return resolve('');

    canvas.width = 1080;
    canvas.height = 1920; // 9:16

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const imgAspect = img.width / img.height;
      const canvasAspect = canvas.width / canvas.height;

      let drawWidth: number, drawHeight: number, drawX: number, drawY: number;

      if (imgAspect > canvasAspect) {
        drawHeight = canvas.height;
        drawWidth = drawHeight * imgAspect;
        drawX = (canvas.width - drawWidth) / 2;
        drawY = 0;
      } else {
        drawWidth = canvas.width;
        drawHeight = drawWidth / imgAspect;
        drawX = 0;
        drawY = (canvas.height - drawHeight) / 2;
      }

      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const drawTextWithBackground = (
        text: string, x: number, y: number, width: number, height: number,
        bgColor: string, textColor: string, fontSize: number
      ) => {
        drawWrappedBanner(ctx, text, x, y, width, bgColor, textColor, fontSize, 20);
      };

      const hasOffer = hasOfferFn(product);

      // Top product name banner
      drawTextWithBackground(
        product.nome.toUpperCase(),
        canvas.width / 2, 200,
        canvas.width * 0.9, 120,
        '#FFD700', '#000000', 56
      );

      // Bottom price banner
      const priceText = hasOffer ? `POR R$ ${product.preco_oferta}` : `POR R$ ${product.preco_regular}`;
      drawTextWithBackground(
        priceText,
        canvas.width / 2, canvas.height - 150,
        canvas.width * 0.95, 130,
        '#16A34A', '#FFFFFF', 64
      );

      if (hasOffer) {
        const oldPriceY = canvas.height - 280;
        const oldPriceText = `De R$ ${product.preco_regular}`;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        // @ts-ignore
        ctx.roundRect(canvas.width / 2 - 250, oldPriceY - 40, 500, 80, 15);
        ctx.fill();

        ctx.fillStyle = '#CCCCCC';
        ctx.font = 'bold 40px Arial';
        ctx.fillText(oldPriceText, canvas.width / 2, oldPriceY);

        const textMetrics = ctx.measureText(oldPriceText);
        ctx.strokeStyle = '#FF4444';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2 - textMetrics.width / 2, oldPriceY);
        ctx.lineTo(canvas.width / 2 + textMetrics.width / 2, oldPriceY);
        ctx.stroke();
      }

      const storyImageData = canvas.toDataURL('image/jpeg', 0.9);
      resolve(storyImageData);
    };

    img.src = product.imagem;
  });
};
