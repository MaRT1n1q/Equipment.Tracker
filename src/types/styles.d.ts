declare module '*.css' {
  const classes: Record<string, string>
  export default classes
}

declare module '*.css?inline' {
  const styles: string
  export default styles
}
