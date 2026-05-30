import type { PipelineContext, StepFunction } from './types.js';

export class PipelineRunner {
  async run(steps: StepFunction[], context: PipelineContext): Promise<PipelineContext> {
    let ctx = context;

    for (let i = 0; i < steps.length; i++) {
      ctx = await steps[i](ctx);
    }

    return ctx;
  }

  compose(...pipelines: Array<(ctx: PipelineContext) => Promise<PipelineContext>>) {
    return async (ctx: PipelineContext): Promise<PipelineContext> => {
      let result = ctx;
      for (const pipeline of pipelines) {
        result = await pipeline(result);
      }
      return result;
    };
  }
}

export const pipeline = new PipelineRunner();
