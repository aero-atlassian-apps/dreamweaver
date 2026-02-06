import fs from 'node:fs/promises'
import path from 'node:path'
import ts from 'typescript'

const repoRoot = process.cwd()

const targets = [
  {
    key: 'BedtimeConductorAgent.conductStorySession',
    file: 'api/src/domain/agents/BedtimeConductorAgent.ts',
    kind: 'classMethod',
    className: 'BedtimeConductorAgent',
    memberName: 'conductStorySession',
  },
  {
    key: 'BedtimeConductorAgent.handleStoryBeat',
    file: 'api/src/domain/agents/BedtimeConductorAgent.ts',
    kind: 'classMethod',
    className: 'BedtimeConductorAgent',
    memberName: 'handleStoryBeat',
  },
  {
    key: 'AtomOfThoughtEngine.arbitrate',
    file: 'api/src/domain/services/AtomOfThoughtEngine.ts',
    kind: 'staticMethod',
    className: 'AtomOfThoughtEngine',
    memberName: 'arbitrate',
  },
  {
    key: 'SleepSentinelAgent.monitorLiveSession',
    file: 'api/src/domain/agents/SleepSentinelAgent.ts',
    kind: 'classMethod',
    className: 'SleepSentinelAgent',
    memberName: 'monitorLiveSession',
  },
  {
    key: 'SafetyGuardian.checkContent',
    file: 'api/src/domain/services/SafetyGuardian.ts',
    kind: 'classMethod',
    className: 'SafetyGuardian',
    memberName: 'checkContent',
  },
  {
    key: 'SupabaseAgentMemory.trackPreferencePair',
    file: 'api/src/infrastructure/memory/SupabaseAgentMemory.ts',
    kind: 'classMethod',
    className: 'SupabaseAgentMemory',
    memberName: 'trackPreferencePair',
  },
  {
    key: 'MemorySummarizationService.summarizeSession',
    file: 'api/src/domain/services/MemorySummarizationService.ts',
    kind: 'classMethod',
    className: 'MemorySummarizationService',
    memberName: 'summarizeSession',
  },
  {
    key: 'GeminiLiveRelay.handleConnection',
    file: 'api/src/infrastructure/services/GeminiLiveRelay.ts',
    kind: 'classMethod',
    className: 'GeminiLiveRelay',
    memberName: 'handleConnection',
  },
  {
    key: 'GeminiLiveSession.sendToolResponse',
    file: 'api/src/infrastructure/adapters/GeminiLiveSession.ts',
    kind: 'classMethod',
    className: 'GeminiLiveSession',
    memberName: 'sendToolResponse',
  },
  {
    key: 'GenerateStoryUseCase.execute',
    file: 'api/src/application/use-cases/GenerateStoryUseCase.ts',
    kind: 'classMethod',
    className: 'GenerateStoryUseCase',
    memberName: 'execute',
  },
]

function getLineRange(sourceFile, node) {
  const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
  const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd())
  return { startLine: start.line + 1, endLine: end.line + 1 }
}

function getNodeName(node) {
  if (!node || !node.name) return null
  if (ts.isIdentifier(node.name)) return node.name.text
  if (ts.isStringLiteral(node.name)) return node.name.text
  return null
}

function findClassDeclaration(sourceFile, className) {
  let found = null
  const visit = (node) => {
    if (found) return
    if (ts.isClassDeclaration(node) && node.name?.text === className) {
      found = node
      return
    }
    ts.forEachChild(node, visit)
  }
  ts.forEachChild(sourceFile, visit)
  return found
}

function findClassMember(classDecl, memberName) {
  for (const member of classDecl.members) {
    if (ts.isMethodDeclaration(member) || ts.isGetAccessorDeclaration(member) || ts.isSetAccessorDeclaration(member)) {
      if (getNodeName(member) === memberName) return member
    }
  }
  return null
}

async function main() {
  const results = {}

  for (const target of targets) {
    const abs = path.resolve(repoRoot, target.file)
    const content = await fs.readFile(abs, 'utf8')
    const sourceFile = ts.createSourceFile(abs, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)

    if (target.kind === 'classMethod' || target.kind === 'staticMethod') {
      const classDecl = findClassDeclaration(sourceFile, target.className)
      if (!classDecl) {
        results[target.key] = { file: target.file, error: `Class not found: ${target.className}` }
        continue
      }

      const member = findClassMember(classDecl, target.memberName)
      if (!member) {
        results[target.key] = { file: target.file, error: `Member not found: ${target.memberName}` }
        continue
      }

      results[target.key] = { file: target.file, ...getLineRange(sourceFile, member) }
      continue
    }

    results[target.key] = { file: target.file, error: `Unsupported kind: ${target.kind}` }
  }

  process.stdout.write(JSON.stringify(results, null, 2) + '\n')
}

main().catch((err) => {
  process.stderr.write(String(err?.stack || err) + '\n')
  process.exitCode = 1
})
