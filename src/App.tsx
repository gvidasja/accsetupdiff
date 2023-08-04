import { CSSProperties, useEffect, useMemo, useState } from 'react'

const colStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
}

const rowStyle: CSSProperties = { display: 'flex', margin: 'auto', justifyContent: 'center' }

function App() {
  const [file1, setFile1] = useState<SetupFile>(JSON.parse(localStorage.getItem('file1') || 'null'))
  const [file2, setFile2] = useState<SetupFile>(JSON.parse(localStorage.getItem('file2') || 'null'))

  useEffect(() => {
    localStorage.setItem('file1', JSON.stringify(file1 || null))
    localStorage.setItem('file2', JSON.stringify(file2 || null))
  }, [file1, file2])

  return (
    <div style={rowStyle} className="gap">
      <div style={colStyle} className="gap">
        <FileInput value={file1} onChange={setFile1} />
        <Diff side="left" src={file1} dst={file2} />
      </div>
      <div style={colStyle} className="gap">
        <FileInput value={file2} onChange={setFile2} />
        <Diff side="right" src={file2} dst={file1} />
      </div>
    </div>
  )
}

function FileInput({ onChange, value }: { onChange: (f: SetupFile) => void; value: SetupFile }) {
  const id = useMemo(() => btoa(Math.random().toString()), [])

  return (
    <div className="file-input">
      <label className="file-input" htmlFor={id}>
        {value?.name ? value.name : 'Select file'}
      </label>
      <input type="file" onChange={async e => onChange(await readFile(e.target.files))} id={id} />
    </div>
  )
}

function Diff({ side: side, src, dst }: { side: string; src: SetupFile; dst: SetupFile }) {
  const srcProps = getProps(src?.content)
  const dstProps = Object.fromEntries(getProps(dst?.content))

  return (
    <div>
      {srcProps.map(([path, value]) => (
        <div className={'diff-line ' + (dstProps[path] === value ? '' : side)}>
          {path}: {JSON.stringify(value)}
          {formatDiff(value, dstProps[path])}
        </div>
      ))}
    </div>
  )
}

function formatDiff(src: V, dst: V) {
  if (typeof src === 'string' || typeof dst === 'string') {
    return ''
  }

  const diff = src - dst

  if (!diff) {
    return ''
  }

  return (
    <div className={diff < 0 ? 'diff-down' : 'diff-up'}>
      {diff < 0 ? '▼' : '▲'}
      {Math.abs(diff)}
    </div>
  )
}

function getProps(file: O, base = ''): P[] {
  if (!file) {
    return []
  }

  const props: P[] = []

  for (const key in file) {
    const v = file[key]

    if (Array.isArray(v)) {
      v.forEach((vv, i) => props.push(...getProps(vv, `${base}.${key}[${i}]`)))
    } else if (typeof v === 'object' && !!v) {
      props.push(...getProps(v as O, `${base}.${key}`))
    } else {
      props.push([`${base}.${key}`, v])
    }
  }

  return props.filter(newFunction).map(tokenize)
}

function newFunction([key]: P) {
  return !/pitStrategy\[[^0]/i.test(key)
}

function tokenize([key, value]: P): P {
  return [key.replace(/^\./, '').split('.').join(' -> '), value]
}

async function readFile(files: FileList | null): Promise<SetupFile> {
  if (!files) {
    return {} as SetupFile
  }

  const file = files[0]

  return {
    name: file.name,
    content: JSON.parse(await file.text()),
  }
}

interface SetupFile {
  name: string
  content: O
}

type O = Record<string, V>
type P = [string, V]
type V = number | string
export default App
