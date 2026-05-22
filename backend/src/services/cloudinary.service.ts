import cloudinary from '../config/cloudinary';
import { ImageProcessor } from '../utils/imageProcessor';

export class CloudinaryService {
  private static BASE_FOLDER = 'Mohanur_Kongu_Matrimony';

  static getFolder(type: 'rasi' | 'navamsa' | 'photo' | 'gallery'): string {
    const folders = {
      rasi: 'Rasi_Chart',
      navamsa: 'Navamsa_Chart',
      photo: 'Profile_Photo',
      gallery: 'Gallery',
    };
    return `${this.BASE_FOLDER}/${folders[type]}`;
  }


  static getPublicId(type: 'rasi' | 'navamsa' | 'photo' | 'gallery', profileId: string, index?: number): string {
    if (type === 'gallery') {
      return `${this.getFolder(type)}/${profileId}/${index || 1}`;
    }
    return `${this.getFolder(type)}/Profile_${profileId}`;
  }

  /**
   * Processes and uploads an image to Cloudinary in compressed SVG format.
   */
  static async uploadAsSvg(
    fileBuffer: Buffer, 
    type: 'rasi' | 'navamsa' | 'photo' | 'gallery', 
    profileId: string,
    index?: number
  ): Promise<string> {
    const svgBuffer = await ImageProcessor.toCompressedSvg(fileBuffer);
    const publicId = this.getPublicId(type, profileId, index);

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          resource_type: 'image',
          format: 'svg',
          overwrite: true,
          invalidate: true,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result!.secure_url);
        }
      );
      uploadStream.end(svgBuffer);
    });
  }

  /**
   * Deletes an image from Cloudinary.
   */
  static async deleteImage(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }
}
