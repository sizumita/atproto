import { Project, SourceFile, VariableDeclarationKind } from 'ts-morph'
import { LexiconDoc } from '@atproto/lexicon'
import prettier from 'prettier'
import { GeneratedFile } from '../types'

const PRETTIER_OPTS = {
  parser: 'babel-ts',
  tabWidth: 2,
  semi: false,
  singleQuote: true,
  trailingComma: 'all' as const,
}

export const utilTs = (project) =>
  gen(project, '/util.ts', async (file) => {
    file.replaceWithText(`
  export function isObj(v: unknown): v is Record<string, unknown> {
    return typeof v === 'object' && v !== null
  }
  
  export function hasProp<K extends PropertyKey>(
    data: object,
    prop: K,
  ): data is Record<K, unknown> {
    return prop in data
  }
  `)
  })

export const lexiconsTs = (project, lexicons: LexiconDoc[]) =>
  gen(project, '/lexicons.ts', async (file) => {
    const nsidToEnum = (nsid: string): string => {
      return nsid
        .split('.')
        .map((word) => word[0].toUpperCase() + word.slice(1))
        .join('')
    }

    //= export const ids = {...}
    file.addVariableStatement({
      isExported: true,
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: 'lexiconIds',
          initializer: JSON.stringify(
            lexicons.reduce((acc, cur) => {
              return {
                ...acc,
                [nsidToEnum(cur.id)]: cur.id,
              }
            }, {}),
          ),
        },
      ],
    })
    //= export const methods = {...}
    file.addVariableStatement({
      isExported: true,
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: 'lexiconMethods',
          initializer: JSON.stringify(
            lexicons.reduce((acc, cur) => {
              if (cur.defs.main?.type === 'procedure') {
                return {
                  ...acc,
                  [nsidToEnum(cur.id)]: 'POST',
                }
              } else if (cur.defs.main?.type === 'query') {
                return {
                  ...acc,
                  [nsidToEnum(cur.id)]: 'GET',
                }
              } else if (cur.defs.main?.type === 'subscription') {
                // TODO
              }
              return acc
            }, {}),
          ),
        },
      ],
    })
  })

export async function gen(
  project: Project,
  path: string,
  gen: (file: SourceFile) => Promise<void>,
): Promise<GeneratedFile> {
  const file = project.createSourceFile(path)
  await gen(file)
  file.saveSync()
  const src = project.getFileSystem().readFileSync(path)
  return {
    path: path,
    content: `${banner()}${prettier.format(src, PRETTIER_OPTS)}`,
  }
}

function banner() {
  return `/**
 * GENERATED CODE - DO NOT MODIFY
 */
`
}
