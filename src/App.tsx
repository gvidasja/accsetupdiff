import { CSSProperties, useEffect, useState } from 'react'

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
    <div style={rowStyle}>
      <div style={colStyle}>
        <input type="file" onChange={async e => setFile1(await readFile(e.target.files))} />
        <Diff color="#d98" src={file1} dst={file2} />
      </div>
      <div style={colStyle}>
        <input type="file" onChange={async e => setFile2(await readFile(e.target.files))} />
        <Diff color="#ad9" src={file2} dst={file1} />
      </div>
    </div>
  )
}

function Diff({ color, src, dst }: { color: string; src: SetupFile; dst: SetupFile }) {
  const srcProps = getProps(src.content)
  const dstProps = Object.fromEntries(getProps(dst.content))

  return srcProps.map(([path, value]) => (
    <div style={{ background: dstProps[path] === value ? 'inherit' : color }}>
      {path}: {JSON.stringify(value)}
    </div>
  ))
}

function getProps(file: O, base = ''): P[] {
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

type O = Record<string, unknown>
type P = [string, unknown]
export default App
