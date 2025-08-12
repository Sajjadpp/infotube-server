const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuid } = require('uuid');

const downloadImageToServer = async (imageUrl) => {
  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(response.data, 'binary');
    const fileExtension = path.extname(new URL(imageUrl).pathname) || '.jpg';
    const filename = `${uuid()}${fileExtension}`;
    const savePath = path.join(__dirname, '../uploads/profileImages', filename);
    
    console.log(filename)
    fs.writeFileSync(savePath, imageBuffer);

    // Return relative path (or full URL if needed)
    return `/uploads/profileImages/${filename}`;
  } catch (err) {
    console.error('Image download failed:', err.message);
    return null;
  }
};

module.exports ={
    downloadImageToServer
}