# Architecture Decision Record (ADR)

## ADR-0001: Deepen Step Narration and Event Recording

- **Status**: Accepted
- **Date**: 2026-10-19
- **Deciders**: Pair Programming Team

### Context

AlgoScope records program execution step by step for visual playback. Step narration (what happened and beginner explanations) currently relies on a shallow module (`say.ts`) and loose string contracts:
1. `interp.ts` and `builtins.ts` mutate transient string fields on the interpreter (`I.note = ...`, `I.compareText = ...`, `I.swapText = ...`).
2. `Interp.step()` concatenates these strings into `step.text`.
3. `say.ts` matches `step.text` against ~35 regex patterns to produce beginner-friendly English (`step.say`).
4. Downstream modules (`analysis.ts`, `Visualizer.tsx`, and `App.tsx`) parse `step.text` and `step.say` again using regexes to extract comparison operators (`compareOp`), quiz questions/answers (`isQuestion`), and call names (`buildCallTree`).

This creates tight string coupling across 5 files, lacks locality, and prevents easy testing of narration logic.

### Decision

1. **Create `StepRecorder`**:
   - Introduce a deep module in `src/engine/recorder.ts`.
   - The module will be instantiated per execution run by `Interp`.
   - Replaces the shallow `say.ts` module.

2. **Discriminated Union for Events**:
   - `interp.ts` and `builtins.ts` record structured events (`compare`, `swap`, `action`, `call`, `check`) rather than formatting arbitrary English strings.
   - `StepRecorder` manages event prioritization (swap > compare > check > action).

3. **Enriched `Step` Seam**:
   - `Step` will retain pre-rendered `text` and `say` strings for backward compatibility.
   - `Step` will add typed metadata:
     - `cmpOp?: string` (comparison operator)
     - `quiz?: { prompt: string; answer: 'Yes' | 'No' }` (prediction question/answer)
     - `callInfo?: { name: string; args?: string[] }`
     - `returnInfo?: { from: string; val?: string }`
   - Downstream consumers (`analysis.ts`, `Visualizer.tsx`, `App.tsx`) will read typed fields directly instead of regex-parsing text.

4. **Incremental Migration**:
   - **Phase 1**: Introduce `src/engine/recorder.ts` and update `Step` in `src/engine/trace.ts`.
   - **Phase 2**: Update consumers in `analysis.ts`, `Visualizer.tsx`, and `App.tsx` to consume typed metadata.
   - **Phase 3**: Migrate `interp.ts` and `builtins.ts` to call `StepRecorder`, then delete `say.ts`.

### Consequences

- **Positive**:
  - Eliminates ~35 fragile cross-file regexes.
  - Locality: Step narration, beginner phrasing, and quiz extraction live in one module.
  - Leverage: Callers pass typed domain data; UI components consume typed properties.
  - Testability: Narration and quiz extraction can be tested directly with unit tests without running full AST evaluation.
- **Negative / Trade-offs**:
  - Adds temporary transitional code while both recording mechanisms coexist during migration.
