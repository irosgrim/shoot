export class AssetManager {
  constructor() {
    this.images = new Map();
  }

  loadImage(url) {
    if (this.images.has(url)) {
      return this.images.get(url);
    }

    const image = new Image();
    image.src = url;
    image.onload = () => {
      this.images.set(url, image);
    };

    return image;
  }

  getImage(url) {
    return this.images.get(url);
  }
}