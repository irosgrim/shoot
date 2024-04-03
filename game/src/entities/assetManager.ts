export class AssetManager {
  images: Map<string, any>;

  constructor() {
    this.images = new Map();
  }

  loadImage(url: string) {
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

  getImage(url: string) {
    return this.images.get(url);
  }
}