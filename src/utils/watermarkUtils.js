/**
 * Utility to apply a watermark to an image file using HTML5 Canvas.
 * @param {File} file - The original image file
 * @param {Object} metadata - Metadata to include: { userName, deviceName, location: {lat, lng}, timestamp }
 * @returns {Promise<File>} - A new File object with the watermark applied
 */
export const addWatermarkToImage = async (file, metadata) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Set dimensions to match source image
                canvas.width = img.width;
                canvas.height = img.height;

                // Draw original image
                ctx.drawImage(img, 0, 0);

                // Watermark Configuration
                const padding = canvas.width * 0.02; // 2% padding
                const fontSize = Math.max(canvas.width * 0.015, 12); // Responsive font size
                ctx.font = `600 ${fontSize}px Inter, Roboto, Arial, sans-serif`;

                // Prepare text lines
                const lines = [
                    `User: ${metadata.userName || 'Unknown'}`,
                    `Device: ${metadata.deviceName || 'Unknown'}`,
                    `Location: ${metadata.location?.lat || 'N.A'}, ${metadata.location?.lng || 'N.A'}`,
                    `Date: ${new Date().toLocaleString()}`
                ];

                // Measure background box
                const lineHeight = fontSize * 1.4;
                const boxWidth = Math.max(...lines.map(line => ctx.measureText(line).width)) + (padding * 2);
                const boxHeight = (lines.length * lineHeight) + (padding * 1.5);

                // Draw semi-transparent background box at bottom-right
                const boxX = canvas.width - boxWidth - padding;
                const boxY = canvas.height - boxHeight - padding;

                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                // Rounded rectangle for aesthetic
                const radius = 8;
                ctx.beginPath();
                ctx.moveTo(boxX + radius, boxY);
                ctx.lineTo(boxX + boxWidth - radius, boxY);
                ctx.quadraticCurveTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + radius);
                ctx.lineTo(boxX + boxWidth, boxY + boxHeight - radius);
                ctx.quadraticCurveTo(boxX + boxWidth, boxY + boxHeight, boxX + boxWidth - radius, boxY + boxHeight);
                ctx.lineTo(boxX + radius, boxY + boxHeight);
                ctx.quadraticCurveTo(boxX, boxY + boxHeight, boxX, boxY + boxHeight - radius);
                ctx.lineTo(boxX, boxY + radius);
                ctx.quadraticCurveTo(boxX, boxY, boxX + radius, boxY);
                ctx.closePath();
                ctx.fill();

                // Draw text
                ctx.fillStyle = 'white';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';

                lines.forEach((line, index) => {
                    ctx.fillText(line, boxX + padding, boxY + (padding * 0.75) + (index * lineHeight));
                });

                // Convert back to File
                canvas.toBlob((blob) => {
                    if (!blob) {
                        reject(new Error('Canvas to Blob conversion failed'));
                        return;
                    }
                    const watermarkedFile = new File([blob], file.name, {
                        type: file.type,
                        lastModified: Date.now()
                    });
                    resolve(watermarkedFile);
                }, file.type, 0.85); // 0.85 quality
            };
            img.onerror = () => reject(new Error('Failed to load image for watermarking'));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('Failed to read file for watermarking'));
        reader.readAsDataURL(file);
    });
};
