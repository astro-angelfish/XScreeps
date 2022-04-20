interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface ImportMetaEnv {
  // 脚本构建时间
  readonly BUILD_TIME: string
  // 是否开启 profiler
  readonly PROFILER: boolean
}
