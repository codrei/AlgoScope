declare module 'monaco-esm/editor/editor.worker.js?worker' {
  const WorkerCtor: new () => Worker;
  export default WorkerCtor;
}
declare module 'monaco-esm/editor/editor.api.js' {
  export * from 'monaco-editor';
}
declare module 'monaco-esm/*';
