import { Router } from 'express';
import { 
  getAllProfiles, 
  getProfileById, 
  getSuggestedProfiles, 
  updateProfileStatus, 
  getMyProfiles,
  createProfile,
  updateProfile,
  deleteProfile,
  uploadProfileImage,
  deleteProfileImage,
  getBrowseProfiles,
  saveDraft,
  getDraft,
  cancelDraft
} from '../controllers/profile';
import { authenticate, optionalAuthenticate } from '../middlewares/auth';
import multer from 'multer';

const router = Router();
const upload = multer();

router.get('/', (req, res, next) => getAllProfiles(req, res).catch(next));
router.get('/browse', optionalAuthenticate, (req, res, next) => getBrowseProfiles(req, res).catch(next));
router.get('/my', authenticate, (req, res, next) => getMyProfiles(req, res).catch(next));
router.get('/suggested', authenticate, (req, res, next) => getSuggestedProfiles(req, res).catch(next));
router.get('/:id', (req, res, next) => getProfileById(req, res).catch(next));
router.post('/', authenticate, (req, res, next) => createProfile(req, res).catch(next));
router.patch('/:id', authenticate, (req, res, next) => updateProfile(req, res).catch(next));
router.delete('/:id', authenticate, (req, res, next) => deleteProfile(req, res).catch(next));

// Draft routes (BEFORE /:id routes to avoid param conflicts)
router.post('/draft', authenticate, (req, res, next) => saveDraft(req, res).catch(next));
router.get('/draft/:draftId', authenticate, (req, res, next) => getDraft(req, res).catch(next));
router.patch('/draft/:draftId/cancel', authenticate, (req, res, next) => cancelDraft(req, res).catch(next));

// Image uploads & deletions
router.post('/:id/images/:type', authenticate, upload.single('image'), (req, res, next) => uploadProfileImage(req, res).catch(next));
router.delete('/:id/images/:type', authenticate, (req, res, next) => deleteProfileImage(req, res).catch(next));


// Update profile status (only status toggle allowed)
router.patch('/:id/status', authenticate, (req, res, next) => updateProfileStatus(req, res).catch(next));

export default router;
