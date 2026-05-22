import prisma from "../config/prisma";

export class MandapamPackageService {
  static async createPackage(data: {
    nameTa: string;
    nameEn: string;
    price: number;
    featuresTa: string[];
    featuresEn: string[];
  }) {
    return await prisma.mandapamPackage.create({
      data: {
        nameTa: data.nameTa,
        nameEn: data.nameEn,
        price: data.price,
        featuresTa: data.featuresTa,
        featuresEn: data.featuresEn,
        isActive: true,
      },
    });
  }

  static async updatePackage(
    id: string,
    data: {
      nameTa?: string;
      nameEn?: string;
      price?: number;
      featuresTa?: string[];
      featuresEn?: string[];
    }
  ) {
    return await prisma.mandapamPackage.update({
      where: { id },
      data,
    });
  }

  static async togglePackageStatus(id: string, isActive: boolean) {
    return await prisma.mandapamPackage.update({
      where: { id },
      data: { isActive },
    });
  }

  static async listPackages(activeOnly: boolean = false) {
    return await prisma.mandapamPackage.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: { price: "asc" },
    });
  }

  static async getPackageById(id: string) {
    return await prisma.mandapamPackage.findUnique({
      where: { id },
    });
  }
}
