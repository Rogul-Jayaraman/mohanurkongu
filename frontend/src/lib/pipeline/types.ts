import { AppError } from '../errors';

export interface PipelineContext<TInput = any, TOutput = unknown> {
  input: TInput;
  output: TOutput;
  errors: Array<{ step: string; error: AppError }>;
  meta: Record<string, unknown>;
}

export type StepFunction<TCtx extends PipelineContext = PipelineContext> = (
  ctx: TCtx,
) => Promise<TCtx>;

export interface PipelineError {
  step: string;
  code: string;
  message: string;
  status: number;
  details?: unknown;
}

export class PipelineAbortError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'PipelineAbortError';
  }
}
