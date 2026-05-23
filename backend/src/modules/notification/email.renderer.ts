import Handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../../common/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEMPLATES_DIR = join(__dirname, 'templates');
const PARTIALS_DIR = join(TEMPLATES_DIR, 'partials');

const PARTIAL_FILES = [
  '_styles',
  'header',
  'greeting',
  'cta-button',
  'otp-block',
  'device-table',
  'info-note',
  'footer',
];

const templateCache = new Map<string, Handlebars.TemplateDelegate>();

function registerPartials(): void {
  for (const name of PARTIAL_FILES) {
    try {
      const content = readFileSync(join(PARTIALS_DIR, `${name}.hbs`), 'utf-8');
      Handlebars.registerPartial(name, content);
    } catch (err) {
      logger.error({ partial: name, error: (err as Error).message }, 'Failed to register partial');
      throw err;
    }
  }
}

function loadAndCompile(templateName: string): Handlebars.TemplateDelegate {
  const cached = templateCache.get(templateName);
  if (cached) return cached;

  const filePath = join(TEMPLATES_DIR, `${templateName}.email.hbs`);
  try {
    const source = readFileSync(filePath, 'utf-8');
    const compiled = Handlebars.compile(source, { preventIndent: true });
    templateCache.set(templateName, compiled);
    return compiled;
  } catch (err) {
    logger.error({ template: templateName, error: (err as Error).message }, 'Failed to load template');
    throw err;
  }
}

let initialized = false;

export function initRenderer(): void {
  if (initialized) return;
  registerPartials();
  initialized = true;
  logger.info('Email template renderer initialized');
}

export function renderEmail(templateName: string, data: Record<string, unknown>): string {
  if (!initialized) {
    initRenderer();
  }
  const template = loadAndCompile(templateName);
  return template(data);
}
