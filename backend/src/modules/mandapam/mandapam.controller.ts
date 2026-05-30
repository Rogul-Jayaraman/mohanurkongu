import type { Request, Response, NextFunction } from 'express';
import { MandapamService } from './mandapam.service.js';
import { sendSuccess } from '../../common/responses/ApiResponse.js';

export class MandapamController {
  constructor(private mandapamService: MandapamService) {}

  // ── Admin Package ──

  adminGetAllPackages = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const packages = await this.mandapamService.getAllPackages();
      sendSuccess(res, { packages });
    } catch (err) { next(err); }
  };

  adminGetPackageById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pkg = await this.mandapamService.getPackageById(req.params.id as string);
      sendSuccess(res, { package: pkg });
    } catch (err) { next(err); }
  };

  adminUpdatePackage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pkg = await this.mandapamService.updatePackage(req.params.id as string, req.body);
      sendSuccess(res, { package: pkg });
    } catch (err) { next(err); }
  };

  adminDeleteFunction = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.mandapamService.deletePackageFunction(req.params.functionId as string);
      sendSuccess(res, { deleted: true });
    } catch (err) { next(err); }
  };

  // ── Admin Facility ──

  adminGetAllFacilities = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const facilities = await this.mandapamService.getAllFacilities();
      sendSuccess(res, { facilities });
    } catch (err) { next(err); }
  };

  adminCreateFacility = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const facility = await this.mandapamService.createFacility(req.body);
      sendSuccess(res, { facility });
    } catch (err) { next(err); }
  };

  adminUpdateFacility = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const facility = await this.mandapamService.updateFacility(req.params.id as string, req.body);
      sendSuccess(res, { facility });
    } catch (err) { next(err); }
  };

  adminDeleteFacility = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.mandapamService.deleteFacility(req.params.id as string);
      sendSuccess(res, { deleted: true });
    } catch (err) { next(err); }
  };

  // ── Admin Addon ──

  adminGetAllAddons = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const addons = await this.mandapamService.getAllAddons();
      sendSuccess(res, { addons });
    } catch (err) { next(err); }
  };

  adminCreateAddon = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const addon = await this.mandapamService.createAddon(req.body);
      sendSuccess(res, { addon });
    } catch (err) { next(err); }
  };

  adminUpdateAddon = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const addon = await this.mandapamService.updateAddon(req.params.id as string, req.body);
      sendSuccess(res, { addon });
    } catch (err) { next(err); }
  };

  adminDeleteAddon = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.mandapamService.deleteAddon(req.params.id as string);
      sendSuccess(res, { deleted: true });
    } catch (err) { next(err); }
  };

  // ── Public ──

  getPublicPackages = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const language = (req.query.language as string) || 'EN';
      const packages = await this.mandapamService.getPublicPackages(language);
      sendSuccess(res, { packages });
    } catch (err) { next(err); }
  };

  getPublicPackageByCode = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const language = (req.query.language as string) || 'EN';
      const pkg = await this.mandapamService.getPublicPackageByCode(req.params.code as string, language);
      sendSuccess(res, { package: pkg });
    } catch (err) { next(err); }
  };

  getPublicFacilities = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const language = (req.query.language as string) || 'EN';
      const facilities = await this.mandapamService.getPublicFacilities(language);
      sendSuccess(res, { facilities });
    } catch (err) { next(err); }
  };

  getPublicAddons = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const language = (req.query.language as string) || 'EN';
      const addons = await this.mandapamService.getPublicAddons(language);
      sendSuccess(res, { addons });
    } catch (err) { next(err); }
  };
}
